import { Router, Request, Response } from 'express';
import { prisma } from '@lms/db';
import { requireAuth } from '../middleware/auth';
import { requireInstructorOfCourse } from '../middleware/courseMembership';
import { upload, getUploadedFileUrl } from '../middleware/upload';

const router = Router();

// Apply auth middleware to all module routes
router.use(requireAuth);

// POST /courses/:courseId/modules - Create a new module (instructors only)
router.post('/courses/:courseId/modules', requireInstructorOfCourse('courseId'), async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { name, position } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Module name is required' });
      return;
    }

    // If position is not provided, calculate the next position
    let modulePosition = position;
    if (modulePosition === undefined || modulePosition === null) {
      const lastModule = await prisma.module.findFirst({
        where: { courseId },
        orderBy: { position: 'desc' }
      });
      modulePosition = lastModule ? lastModule.position + 1 : 0;
    }

    // Create the module
    const module = await prisma.module.create({
      data: {
        name,
        position: modulePosition,
        courseId
      }
    });

    res.status(201).json({ module });
  } catch (err) {
    console.error('Create module error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /modules/:moduleId/pages - Get all pages in a module
router.get('/modules/:moduleId/pages', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { moduleId } = req.params;

    // Fetch the module to verify it exists and get courseId
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    // Check if user has access to this course
    const membership = await prisma.courseMembership.findUnique({
      where: {
        courseId_userId: {
          courseId: module.courseId,
          userId: req.user.userId
        }
      }
    });

    if (!membership) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Fetch all pages in this module
    const pages = await prisma.page.findMany({
      where: { moduleId },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ pages });
  } catch (err) {
    console.error('Get pages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /modules/:moduleId/pages - Create a new page in a module (instructors only)
router.post('/modules/:moduleId/pages', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { moduleId } = req.params;
    const { title, bodyMarkdown } = req.body;

    if (!title || !bodyMarkdown) {
      res.status(400).json({ error: 'Title and bodyMarkdown are required' });
      return;
    }

    // Fetch the module to get the courseId
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true }
    });

    if (!module) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    // Check if the user is an instructor of the course
    const membership = await prisma.courseMembership.findUnique({
      where: {
        courseId_userId: {
          courseId: module.courseId,
          userId: req.user.userId
        }
      }
    });

    if (!membership || membership.role !== 'instructor') {
      res.status(403).json({ error: 'Only instructors can create pages' });
      return;
    }

    // Create the page
    const page = await prisma.page.create({
      data: {
        title,
        bodyMarkdown,
        moduleId,
        courseId: module.courseId
      }
    });

    res.status(201).json({ page });
  } catch (err) {
    console.error('Create page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TODO: Document upload endpoints moved to /routes/documents.ts
// These endpoints are removed to avoid duplication.
// Use POST /documents/upload and GET /documents instead.

export default router;

