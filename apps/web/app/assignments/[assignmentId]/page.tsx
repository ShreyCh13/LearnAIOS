'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { apiFetch } from '@/lib/apiClient';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentList } from '@/components/documents/DocumentList';

interface Assignment {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  courseId?: string;
  course?: {
    id: string;
    title: string;
  };
  module?: {
    id: string;
    title: string;
  };
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshDocuments, setRefreshDocuments] = useState(0);

  // Check auth
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load assignment
  useEffect(() => {
    if (user && assignmentId) {
      loadAssignment();
    }
  }, [user, assignmentId]);

  const loadAssignment = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch(`/api/assignments/${assignmentId}`);
      if (response.ok) {
        const data = await response.json();
        setAssignment(data.assignment);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load assignment');
      }
    } catch (err) {
      console.error('Failed to load assignment:', err);
      setError('Failed to load assignment');
    } finally {
      setLoading(false);
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

  if (error || !assignment) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '16px'
      }}>
        <div style={{ fontSize: '18px', color: '#dc2626' }}>
          {error || 'Assignment not found'}
        </div>
        <button
          onClick={() => router.back()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '32px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          style={{
            padding: '6px 12px',
            marginBottom: '24px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back
        </button>

        {/* Assignment Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '12px'
          }}>
            ASSIGNMENT
          </div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px'
          }}>
            {assignment.name}
          </h1>

          {/* Course and Module Info */}
          {(assignment.course || assignment.module) && (
            <div style={{
              display: 'flex',
              gap: '16px',
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '16px'
            }}>
              {assignment.course && (
                <div>
                  <span style={{ fontWeight: '600' }}>Course: </span>
                  {assignment.course.title}
                </div>
              )}
              {assignment.module && (
                <div>
                  <span style={{ fontWeight: '600' }}>Module: </span>
                  {assignment.module.title}
                </div>
              )}
            </div>
          )}

          {/* Due Date */}
          {assignment.dueDate && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <span>📅</span>
              Due: {new Date(assignment.dueDate).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>

        {/* Assignment Description */}
        <div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Description
          </h2>
          <div style={{
            fontSize: '16px',
            lineHeight: '1.7',
            color: '#374151',
            whiteSpace: 'pre-wrap'
          }}>
            {assignment.description || 'No description provided.'}
          </div>
        </div>

        {/* Document Attachments */}
        <div style={{ marginTop: '32px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px'
          }}>
            📎 Attachments
          </h2>
          
          {user?.role === 'instructor' && assignment.courseId && (
            <div style={{ marginBottom: '24px' }}>
              <DocumentUpload
                courseId={assignment.courseId}
                assignmentId={assignmentId}
                onUploadComplete={() => {
                  setRefreshDocuments(prev => prev + 1);
                }}
              />
            </div>
          )}
          
          {assignment.courseId && (
            <DocumentList
              courseId={assignment.courseId}
              assignmentId={assignmentId}
              key={refreshDocuments}
            />
          )}
        </div>

        {/* Submit Button (placeholder) */}
        <div style={{ marginTop: '32px' }}>
          <button
            disabled
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#e5e7eb',
              color: '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'not-allowed'
            }}
          >
            Submit Assignment (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}

