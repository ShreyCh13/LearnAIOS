'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

interface Document {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  moduleId?: string;
  assignmentId?: string;
  uploader?: {
    name: string;
    email: string;
  };
}

interface DocumentListProps {
  courseId?: string;
  moduleId?: string;
  assignmentId?: string;
}

export function DocumentList({ courseId, moduleId, assignmentId }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [courseId, moduleId, assignmentId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId);
      if (moduleId) params.append('moduleId', moduleId);
      if (assignmentId) params.append('assignmentId', assignmentId);

      const response = await apiFetch(`/api/documents?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (doc: Document) => {
    // Use the url field from the API response for direct download
    // The API serves files from /uploads/ which is proxied correctly
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.originalName;
    link.target = '_blank'; // Open in new tab as fallback
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('doc')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
    return '📎';
  };

  if (loading) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
        Loading documents...
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        No documents uploaded yet
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {documents.map((doc) => (
        <div
          key={doc.id}
          onClick={() => handleDownload(doc)}
          style={{
            padding: '12px 16px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4f46e5';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <span style={{ fontSize: '24px' }}>{getFileIcon(doc.mimeType)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#111827',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {doc.title}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {formatFileSize(doc.size)}
                {doc.uploader && ` • ${doc.uploader.name}`}
              </div>
            </div>
          </div>
          <div style={{
            padding: '4px 12px',
            backgroundColor: '#eff6ff',
            color: '#1e40af',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            Download
          </div>
        </div>
      ))}
    </div>
  );
}

