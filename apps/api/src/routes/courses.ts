import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { courseService } from '../modules/content/courseService';
import { logger } from '../core/logger';

const router = Router();

// Apply auth middleware
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    
    const courses = await courseService.listCourses(userId, role);
    res.json({ courses });
  } catch (err: any) {
    logger.error('List courses error', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'instructor') {
      return res.status(403).json({ error: 'Only instructors can create courses' });
    }

    const course = await courseService.createCourse(
      req.user!.tenantId,
      req.body,
      req.user!.userId
    );
    res.status(201).json({ course });
  } catch (err: any) {
    logger.error('Create course error', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:courseId', async (req: Request, res: Response) => {
  try {
    const course = await courseService.getCourse(req.params.courseId, req.user!.userId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ course });
  } catch (err: any) {
    if (err.statusCode === 403) return res.status(403).json({ error: err.message });
    logger.error('Get course error', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
