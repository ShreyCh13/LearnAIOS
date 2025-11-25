import { Router, Request, Response } from 'express';
import { prisma } from '@lms/db';
import { requireAuth } from '../middleware/auth';
import { requireInstructorOfCourse, requireCourseMember } from '../middleware/courseMembership';

const router = Router();

// Apply auth middleware to all event routes
router.use(requireAuth);

// POST /courses/:courseId/events - Create a new calendar event (instructors only)
router.post('/courses/:courseId/events', requireInstructorOfCourse('courseId'), async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { title, description, startAt, endAt } = req.body;

    if (!title || !description || !startAt || !endAt) {
      res.status(400).json({ error: 'Title, description, startAt, and endAt are required' });
      return;
    }

    // Parse the dates
    const startAtDate = new Date(startAt);
    const endAtDate = new Date(endAt);

    if (isNaN(startAtDate.getTime()) || isNaN(endAtDate.getTime())) {
      res.status(400).json({ error: 'Invalid date format for startAt or endAt' });
      return;
    }

    if (endAtDate < startAtDate) {
      res.status(400).json({ error: 'endAt must be after startAt' });
      return;
    }

    // Create the calendar event
    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startAt: startAtDate,
        endAt: endAtDate,
        courseId,
        assignmentId: null
      }
    });

    res.status(201).json({ event });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /courses/:courseId/events - Get all calendar events for a course
router.get('/courses/:courseId/events', requireCourseMember('courseId'), async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const events = await prisma.calendarEvent.findMany({
      where: {
        courseId
      },
      include: {
        assignment: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        startAt: 'asc'
      }
    });

    res.json({ events });
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


