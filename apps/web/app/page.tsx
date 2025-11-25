'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { apiFetch } from '@/lib/apiClient';

interface Course {
  id: string;
  title: string;
  description?: string;
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadCourses();
    }
  }, [user, authLoading, router]);

  const loadCourses = async () => {
    try {
      const response = await apiFetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = async (courseId: string) => {
    try {
      // Fetch modules for this course to find the first page
      const response = await apiFetch(`/api/courses/${courseId}/modules`);
      if (response.ok) {
        const data = await response.json();
        const modules = data.modules || [];
        
        if (modules.length > 0) {
          // Sort by position field (not order)
          const firstModule = modules.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))[0];
          
          // Fetch pages for the first module
          const pagesResponse = await apiFetch(`/api/modules/${firstModule.id}/pages`);
          if (pagesResponse.ok) {
            const pagesData = await pagesResponse.json();
            const pages = pagesData.pages || [];
            
            if (pages.length > 0) {
              // Pages don't have order field, use createdAt or just take first one
              const firstPage = pages[0];
              router.push(`/courses/${courseId}/modules/${firstModule.id}/pages/${firstPage.id}`);
              return;
            }
          }
        }
        
        // Fallback: if no pages found, just alert
        alert('No content available for this course yet.');
      }
    } catch (error) {
      console.error('Failed to navigate to course:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
        My Courses
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>
        Select a course to start learning
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {courses.map((course) => (
          <div
            key={course.id}
            onClick={() => handleCourseClick(course.id)}
            style={{
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = '#4f46e5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
              {course.title}
            </h2>
            {course.description && (
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                {course.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px',
          color: '#6b7280'
        }}>
          No courses available yet.
        </div>
      )}
    </div>
  );
}

