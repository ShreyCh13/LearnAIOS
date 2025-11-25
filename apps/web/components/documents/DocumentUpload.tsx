'use client';

import { useState, useRef } from 'react';
import { apiFetch } from '@/lib/apiClient';

interface DocumentUploadProps {
  courseId: string;
  moduleId?: string;
  assignmentId?: string;
  onUploadComplete?: () => void;
}

export function DocumentUpload({ courseId, moduleId, assignmentId, onUploadComplete }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', courseId);
      if (moduleId) formData.append('moduleId', moduleId);
      if (assignmentId) formData.append('assignmentId', assignmentId);
      formData.append('title', file.name);

      const response = await apiFetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        headers: {}, // Don't set Content-Type, let browser set it with boundary
      });

      if (response.ok) {
        if (onUploadComplete) onUploadComplete();
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        const data = await response.json();
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          padding: '24px',
          border: `2px dashed ${dragActive ? '#4f46e5' : '#d1d5db'}`,
          borderRadius: '8px',
          backgroundColor: dragActive ? '#eef2ff' : '#f9fafb',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleChange}
          disabled={uploading}
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.zip,.ppt,.pptx,.xls,.xlsx"
        />

        {uploading ? (
          <div style={{ color: '#6b7280' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
            <div style={{ fontSize: '14px' }}>Uploading...</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
            <div style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
              <strong>Click to upload</strong> or drag and drop
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              PDF, DOC, images, ZIP (max 50MB)
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          backgroundColor: '#fee2e2',
          borderRadius: '6px',
          color: '#991b1b',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}


