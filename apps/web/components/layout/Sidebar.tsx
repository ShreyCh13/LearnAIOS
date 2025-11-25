'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';

interface Course {
  id: string;
  title: string;
}

interface Module {
  id: string;
  name: string;
  position: number;
  pages?: Page[];
}

interface Page {
  id: string;
  title: string;
  createdAt: string;
}

interface SidebarProps {
  courses: Course[];
  selectedCourseId?: string;
  modulesByCourse: Record<string, Module[]>;
  onSelectCourse: (courseId: string) => void;
  onSelectPage: (courseId: string, moduleId: string, pageId: string) => void;
}

export function Sidebar({
  courses,
  selectedCourseId,
  modulesByCourse,
  onSelectCourse,
  onSelectPage,
}: SidebarProps) {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div style={{ padding: '16px' }}>
      {/* Instructor Dashboard Link */}
      {user?.role === 'instructor' && (
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => router.push('/instructor')}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f0fdf4',
              cursor: 'pointer',
              fontWeight: '600',
              color: '#065f46',
              fontSize: '14px'
            }}
          >
            📚 Instructor Dashboard
          </button>
        </div>
      )}

      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
        Courses
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {courses.map((course) => (
          <div key={course.id}>
            <button
              onClick={() => onSelectCourse(course.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: selectedCourseId === course.id ? '#e0e7ff' : 'transparent',
                cursor: 'pointer',
                fontWeight: selectedCourseId === course.id ? '600' : '400',
              }}
            >
              {course.title}
            </button>
            
            {/* Show modules if this course is selected */}
            {selectedCourseId === course.id && modulesByCourse[course.id] && (
              <div style={{ marginLeft: '16px', marginTop: '8px' }}>
                {modulesByCourse[course.id]
                  .sort((a, b) => a.position - b.position)
                  .map((module) => (
                    <div key={module.id} style={{ marginBottom: '8px' }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        marginBottom: '4px',
                        color: '#6b7280' 
                      }}>
                        {module.name}
                      </div>
                      
                      {/* Show pages if available */}
                      {module.pages && module.pages.length > 0 && (
                        <div style={{ marginLeft: '12px' }}>
                          {module.pages
                            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                            .map((page) => (
                              <button
                                key={page.id}
                                onClick={() => onSelectPage(course.id, module.id, page.id)}
                                style={{
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  color: '#374151',
                                }}
                              >
                                {page.title}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

