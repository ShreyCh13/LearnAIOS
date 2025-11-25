'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { apiFetch } from '@/lib/apiClient';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { AIChatPanel } from '@/components/ai/AIChatPanel';
import ReactMarkdown from 'react-markdown';

interface Course {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  order: number;
  pages?: Page[];
}

interface Page {
  id: string;
  title: string;
  order: number;
  bodyMarkdown?: string;
}

interface Assignment {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
}

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const courseId = params.courseId as string;
  const moduleId = params.moduleId as string;
  const pageId = params.pageId as string;

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modulesByCourse, setModulesByCourse] = useState<Record<string, Module[]>>({});
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Ref to hold the send message function from AIChatPanel
  const sendMessageRef = useRef<((message: string, toolHint?: string, questionCount?: number) => void) | null>(null);

  // Check auth
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load courses on mount
  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  // Load modules when course changes
  useEffect(() => {
    if (courseId && courses.length > 0) {
      const course = courses.find((c) => c.id === courseId);
      if (course) {
        setSelectedCourse(course);
        loadModulesForCourse(courseId);
      }
    }
  }, [courseId, courses]);

  // Load page content
  useEffect(() => {
    if (pageId) {
      loadPageContent(pageId);
    }
  }, [pageId]);

  // Load assignments and events when courseId changes
  useEffect(() => {
    if (courseId) {
      loadAssignments(courseId);
      loadEvents(courseId);
    }
  }, [courseId]);

  const loadCourses = async () => {
    try {
      const response = await apiFetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const loadModulesForCourse = async (cId: string) => {
    try {
      const response = await apiFetch(`/api/courses/${cId}/modules`);
      if (response.ok) {
        const data = await response.json();
        const modules = data.modules || [];
        
        // Load pages for each module
        const modulesWithPages = await Promise.all(
          modules.map(async (module: Module) => {
            const pagesResponse = await apiFetch(`/api/modules/${module.id}/pages`);
            if (pagesResponse.ok) {
              const pagesData = await pagesResponse.json();
              return { ...module, pages: pagesData.pages || [] };
            }
            return module;
          })
        );
        
        setModulesByCourse((prev) => ({
          ...prev,
          [cId]: modulesWithPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  };

  const loadPageContent = async (pId: string) => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/pages/${pId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentPage(data.page);
      }
    } catch (error) {
      console.error('Failed to load page:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async (cId: string) => {
    try {
      const response = await apiFetch(`/api/courses/${cId}/assignments`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  };

  const loadEvents = async (cId: string) => {
    try {
      const response = await apiFetch(`/api/courses/${cId}/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const handleSelectCourse = (cId: string) => {
    // Load modules if not already loaded
    if (!modulesByCourse[cId]) {
      loadModulesForCourse(cId);
    }
  };

  const handleSelectPage = (cId: string, mId: string, pId: string) => {
    router.push(`/courses/${cId}/modules/${mId}/pages/${pId}`);
  };

  // Handle send message from command palette or other sources
  const handleSendMessage = (message: string, toolHint?: string, questionCount?: number) => {
    if (sendMessageRef.current) {
      sendMessageRef.current(message, toolHint, questionCount);
    }
  };

  if (authLoading || !user) {
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
    <AppShell
      topBar={
        <TopBar 
          courseTitle={selectedCourse?.title}
          pageTitle={currentPage?.title}
          courseId={courseId}
          moduleId={moduleId}
          pageId={pageId}
          onSendMessage={handleSendMessage}
        />
      }
      leftSidebar={
        <Sidebar
          courses={courses}
          selectedCourseId={courseId}
          modulesByCourse={modulesByCourse}
          onSelectCourse={handleSelectCourse}
          onSelectPage={handleSelectPage}
        />
      }
      rightPanel={
        <AIChatPanel 
          courseId={courseId}
          moduleId={moduleId}
          pageId={pageId} 
          onRegisterSendMessage={(sendFn) => {
            sendMessageRef.current = sendFn;
          }}
        />
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          Loading page content...
        </div>
      ) : currentPage ? (
        <div style={{ maxWidth: '800px' }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            marginBottom: '24px',
            color: '#111827'
          }}>
            {currentPage.title}
          </h1>
          
          <div style={{ 
            fontSize: '16px', 
            lineHeight: '1.7',
            color: '#374151',
            marginBottom: '48px'
          }}>
            <ReactMarkdown>{currentPage.bodyMarkdown || ''}</ReactMarkdown>
          </div>

          {/* Assignments Section */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#111827'
            }}>
              📝 Assignments
            </h2>
            {assignments.length === 0 ? (
              <div style={{
                padding: '24px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                No assignments for this course yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    onClick={() => router.push(`/assignments/${assignment.id}`)}
                    style={{
                      padding: '16px',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      marginBottom: '4px',
                      color: '#111827'
                    }}>
                      {assignment.name}
                    </div>
                    {assignment.dueDate && (
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Due: {new Date(assignment.dueDate).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Events Section */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#111827'
            }}>
              📅 Events
            </h2>
            {events.length === 0 ? (
              <div style={{
                padding: '24px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                No events for this course yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {events.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      padding: '16px',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      marginBottom: '4px',
                      color: '#111827'
                    }}>
                      {event.title}
                    </div>
                    {event.description && (
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        {event.description}
                      </div>
                    )}
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {new Date(event.startDate).toLocaleString()}
                      {event.endDate && ` - ${new Date(event.endDate).toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          Page not found
        </div>
      )}
    </AppShell>
  );
}

