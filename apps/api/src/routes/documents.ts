import { Router, Request, Response } from 'express';
import { prisma } from '@lms/db';
import { requireAuth } from '../middleware/auth';
import { requireCourseMember, requireInstructorOfCourse } from '../middleware/courseMembership';
import { upload, getUploadedFileUrl } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

const router = Router();

// Apply auth middleware to all document routes
router.use(requireAuth);

// POST /documents/upload - Upload a document (instructors only)
router.post(
  '/documents/upload',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { courseId, moduleId, assignmentId, title } = req.body;
      const file = req.file;

      // Validate courseId is present
      if (!courseId) {
        res.status(400).json({ error: 'courseId is required' });
        return;
      }

      // Validate file is present
      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Check that user is an instructor of the course
      const membership = await prisma.courseMembership.findUnique({
        where: {
          courseId_userId: {
            courseId,
            userId: req.user.userId,
          },
        },
      });

      if (!membership || membership.role !== 'instructor') {
        res.status(403).json({ error: 'Only instructors can upload documents' });
        return;
      }

      // If moduleId is provided, verify it belongs to the course
      if (moduleId) {
        const module = await prisma.module.findUnique({
          where: { id: moduleId },
        });

        if (!module || module.courseId !== courseId) {
          res.status(400).json({ error: 'Invalid moduleId for this course' });
          return;
        }
      }

      // If assignmentId is provided, verify it belongs to the course
      if (assignmentId) {
        const assignment = await prisma.assignment.findUnique({
          where: { id: assignmentId },
        });

        if (!assignment || assignment.courseId !== courseId) {
          res.status(400).json({ error: 'Invalid assignmentId for this course' });
          return;
        }
      }

      // Create document record
      const document = await prisma.document.create({
        data: {
          courseId,
          moduleId: moduleId || null,
          assignmentId: assignmentId || null,
          title: title || file.originalname,
          fileName: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: getUploadedFileUrl(file.filename),
          uploadedBy: req.user.userId,
        },
      });

      res.status(201).json({ document });
    } catch (err) {
      console.error('Upload document error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /documents - List documents (course members only)
router.get('/documents', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { courseId, moduleId, assignmentId } = req.query;

    // Validate courseId is present
    if (!courseId || typeof courseId !== 'string') {
      res.status(400).json({ error: 'courseId query parameter is required' });
      return;
    }

    // Check that user is a member of the course
    const membership = await prisma.courseMembership.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: req.user.userId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this course' });
      return;
    }

    // Build where clause
    const where: any = {
      courseId,
    };

    if (moduleId && typeof moduleId === 'string') {
      where.moduleId = moduleId;
    }

    if (assignmentId && typeof assignmentId === 'string') {
      where.assignmentId = assignmentId;
    }

    // Query documents
    const documents = await prisma.document.findMany({
      where,
      select: {
        id: true,
        title: true,
        originalName: true,
        mimeType: true,
        size: true,
        url: true,
        createdAt: true,
        moduleId: true,
        assignmentId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ documents });
  } catch (err) {
    console.error('List documents error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /documents/:documentId - Get a specific document
router.get('/documents/:documentId', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { documentId } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check that user is a member of the course
    const membership = await prisma.courseMembership.findUnique({
      where: {
        courseId_userId: {
          courseId: document.courseId,
          userId: req.user.userId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this course' });
      return;
    }

    res.json({ document });
  } catch (err) {
    console.error('Get document error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /documents/:documentId/download - Download a document
router.get('/documents/:documentId/download', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { documentId } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check that user is a member of the course
    const membership = await prisma.courseMembership.findUnique({
      where: {
        courseId_userId: {
          courseId: document.courseId,
          userId: req.user.userId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this course' });
      return;
    }

    // Build file path
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    const filePath = path.join(uploadsDir, document.fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found on server' });
      return;
    }

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Length', document.size.toString());

    // Send file
    res.sendFile(filePath);
  } catch (err) {
    console.error('Download document error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /documents/:documentId - Delete a document (instructors only)
router.delete('/documents/:documentId', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { documentId } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check that user is an instructor of the course
    const membership = await prisma.courseMembership.findUnique({
      where: {
        courseId_userId: {
          courseId: document.courseId,
          userId: req.user.userId,
        },
      },
    });

    if (!membership || membership.role !== 'instructor') {
      res.status(403).json({ error: 'Only instructors can delete documents' });
      return;
    }

    // Delete file from disk
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    const filePath = path.join(uploadsDir, document.fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await prisma.document.delete({
      where: { id: documentId },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


