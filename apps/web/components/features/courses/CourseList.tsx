import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/apiClient';

interface Course {
  id: string;
  title: string;
  description: string;
}

interface CourseListProps {
  courses: Course[];
  onCourseSelect: (courseId: string) => void;
  onAddCourse: () => void;
}

export function CourseList({ courses, onCourseSelect, onAddCourse }: CourseListProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>My Courses</h2>
        <button
          onClick={onAddCourse}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          + New Course
        </button>
      </div>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {courses.map((course) => (
          <div
            key={course.id}
            onClick={() => onCourseSelect(course.id)}
            style={{
              padding: '24px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{course.title}</h3>
            <p style={{ color: '#6b7280' }}>{course.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


