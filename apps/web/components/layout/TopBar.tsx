'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { CommandPalette } from '@/components/ai/CommandPalette';

interface TopBarProps {
  courseTitle?: string;
  pageTitle?: string;
  courseId?: string;
  moduleId?: string;
  pageId?: string;
  onSendMessage?: (message: string, toolHint?: string, questionCount?: number) => void;
}

export function TopBar({ courseTitle, pageTitle, courseId, moduleId, pageId, onSendMessage }: TopBarProps) {
  const { user, logout } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0 24px',
      height: '100%',
      backgroundColor: '#fff'
    }}>
      {/* Left: App name and current location */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
          LearnAI OS
        </h1>
        {courseTitle && (
          <>
            <span style={{ color: '#9ca3af' }}>/</span>
            <span style={{ fontSize: '16px', color: '#6b7280' }}>{courseTitle}</span>
          </>
        )}
        {pageTitle && (
          <>
            <span style={{ color: '#9ca3af' }}>/</span>
            <span style={{ fontSize: '16px', color: '#374151' }}>{pageTitle}</span>
          </>
        )}
      </div>

      {/* Right: Command palette placeholder + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          onClick={() => setIsCommandPaletteOpen(true)}
        >
          ⌘K Command Palette
        </button>
        
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {user.name || user.email}
            </span>
            <button
              onClick={logout}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        courseId={courseId}
        moduleId={moduleId}
        pageId={pageId}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}

