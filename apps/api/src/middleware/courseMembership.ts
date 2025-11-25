import { Request, Response, NextFunction } from 'express';
import { prisma } from '@lms/db';
import { CourseMembership, Course } from '@prisma/client';

// Extend Express Request type to include membership and course
declare global {
  namespace Express {
    interface Request {
      membership?: CourseMembership;
      course?: Course;
    }
  }
}

/**
 * Middleware to check if the authenticated user has a specific role in a course
 * @param courseIdParam - The name of the route parameter containing the course ID
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export const requireCourseRole = (
  courseIdParam: string,
  allowedRoles: string[]
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const courseId = req.params[courseIdParam];
      
      if (!courseId) {
        res.status(400).json({ error: `Missing ${courseIdParam} parameter` });
        return;
      }

      // Find the course membership for this user and course
      const membership = await prisma.courseMembership.findUnique({
        where: {
          courseId_userId: {
            courseId,
            userId: req.user.userId
          }
        },
        include: {
          course: true
        }
      });

      if (!membership) {
        res.status(403).json({ error: 'You are not a member of this course' });
        return;
      }

      // Check if the user's role is in the allowed roles
      if (!allowedRoles.includes(membership.role)) {
        res.status(403).json({ 
          error: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
        });
        return;
      }

      // Ensure the course belongs to the user's tenant
      if (membership.course.tenantId !== req.user.tenantId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Attach membership and course to the request for use in the route handler
      req.membership = membership;
      req.course = membership.course;

      next();
    } catch (err) {
      console.error('Course role check error:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  };
};

/**
 * Convenience middleware that requires the user to be an instructor of the course
 * @param courseIdParam - The name of the route parameter containing the course ID
 */
export const requireInstructorOfCourse = (courseIdParam: string = 'courseId') => {
  return requireCourseRole(courseIdParam, ['instructor']);
};

/**
 * Middleware that requires the user to be a member (student or instructor) of the course
 * @param courseIdParam - The name of the route parameter containing the course ID
 */
export const requireCourseMember = (courseIdParam: string = 'courseId') => {
  return requireCourseRole(courseIdParam, ['student', 'instructor']);
};


