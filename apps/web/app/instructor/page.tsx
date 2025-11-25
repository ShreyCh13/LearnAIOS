'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { apiFetch } from '@/lib/apiClient';
import { CourseList } from '@/components/features/courses/CourseList';

export default function InstructorDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (user?.role === 'instructor') loadCourses();
  }, [user, authLoading]);

  const loadCourses = async () => {
    try {
      const res = await apiFetch('/api/courses');
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>Instructor Dashboard</h1>
      <CourseList 
        courses={courses} 
        onCourseSelect={(id) => console.log('Selected', id)}
        onAddCourse={() => console.log('Add course')}
      />
    </div>
  );
}
