import { prisma } from '../../core/database';
import { NotFoundError, ForbiddenError } from '../../core/errors';

export class CourseService {
  async listCourses(userId: string, role: string) {
    // If instructor, show all courses in tenant? Or just theirs?
    // Canvas: Instructors see courses they are enrolled in as 'TeacherEnrollment'.
    // We'll stick to enrollment-based visibility.
    
    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: 'active' },
      include: { 
        section: {
          include: { course: true }
        } 
      }
    });

    // Also support legacy memberships for migration
    const legacyMemberships = await prisma.courseMembership.findMany({
      where: { userId },
      include: { course: true }
    });

    const courses = [
      ...enrollments.map(e => e.section.course),
      ...legacyMemberships.map(m => m.course)
    ];

    // Deduplicate
    const uniqueCourses = Array.from(new Map(courses.map(c => [c.id, c])).values());
    return uniqueCourses;
  }

  async createCourse(tenantId: string, data: { title: string; description: string }, creatorId: string) {
    // 1. Create Course
    const course = await prisma.course.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description,
        isPublished: false
      }
    });

    // 2. Create Default Section
    const section = await prisma.section.create({
      data: {
        courseId: course.id,
        name: 'Default Section'
      }
    });

    // 3. Enroll Creator
    await prisma.enrollment.create({
      data: {
        sectionId: section.id,
        userId: creatorId,
        role: 'instructor',
        status: 'active'
      }
    });

    return course;
  }

  async getCourse(courseId: string, userId: string) {
    // Check access
    const hasAccess = await this.checkAccess(courseId, userId);
    if (!hasAccess) throw new ForbiddenError('Not enrolled in this course');

    return await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: { orderBy: { position: 'asc' } }
      }
    });
  }

  private async checkAccess(courseId: string, userId: string): Promise<boolean> {
    // Check legacy
    const membership = await prisma.courseMembership.findUnique({
      where: { courseId_userId: { courseId, userId } }
    });
    if (membership) return true;

    // Check new enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        section: { courseId }
      }
    });
    return !!enrollment;
  }
}

export const courseService = new CourseService();


