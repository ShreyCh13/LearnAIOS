import { Router, Request, Response } from 'express';
import { prisma } from '@lms/db';
import { requireAuth } from '../middleware/auth';
import { requireInstructorOfCourse, requireCourseMember } from '../middleware/courseMembership';

const router = Router();

// Apply auth middleware to all assignment routes
router.use(requireAuth);

// POST /courses/:courseId/assignments - Create a new assignment (instructors only)
router.post('/courses/:courseId/assignments', requireInstructorOfCourse('courseId'), async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { name, description, dueAt, points, moduleId } = req.body;

    if (!name || !description || !dueAt) {
      res.status(400).json({ error: 'Name, description, and dueAt are required' });
      return;
    }

    // Parse the dueAt date
    const dueAtDate = new Date(dueAt);
    if (isNaN(dueAtDate.getTime())) {
      res.status(400).json({ error: 'Invalid dueAt date format' });
      return;
    }

    // If moduleId is provided, verify it belongs to the course
    if (moduleId) {
      const module = await prisma.module.findUnique({
        where: { id: moduleId }
      });

      if (!module || module.courseId !== courseId) {
        res.status(400).json({ error: 'Invalid moduleId for this course' });
        return;
      }
    }

    // Create the assignment
    const assignment = await prisma.assignment.create({
      data: {
        name,
        description,
        dueAt: dueAtDate,
        points: points || 100,
        courseId,
        moduleId: moduleId || null
      }
    });

    // Create a corresponding calendar event
    await prisma.calendarEvent.create({
      data: {
        title: name,
        description,
        startAt: dueAtDate,
        endAt: dueAtDate,
        courseId,
        assignmentId: assignment.id
      }
    });

    res.status(201).json({ assignment });
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /courses/:courseId/assignments - Get all assignments for a course
router.get('/courses/:courseId/assignments', requireCourseMember('courseId'), async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const assignments = await prisma.assignment.findMany({
      where: {
        courseId
      },
      include: {
        module: {
          select: {
            id: true,
            name: true
          }
        },
        documents: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: {
        dueAt: 'asc'
      }
    });

    res.json({ assignments });
  } catch (err) {
    console.error('Get assignments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /assignments/:assignmentId - Get a specific assignment
router.get('/assignments/:assignmentId', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { assignmentId } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: true,
        module: {
          select: {
            id: true,
            name: true
          }
        },
        documents: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Check course membership
    const membership = await prisma.courseMembership.findUnique({
      where: {
        courseId_userId: {
          courseId: assignment.courseId,
          userId: req.user.userId
        }
      }
    });

    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this course' });
      return;
    }

    res.json({ assignment });
  } catch (err) {
    console.error('Get assignment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

