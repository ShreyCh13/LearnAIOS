'use client';

import { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  rightPanel?: ReactNode;
  leftSidebar?: ReactNode;
  topBar?: ReactNode;
}

export function AppShell({ children, rightPanel, leftSidebar, topBar }: AppShellProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top Bar */}
      {topBar && (
        <div style={{ 
          height: '60px', 
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0 
        }}>
          {topBar}
        </div>
      )}
      
      {/* Main content area with sidebars */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar */}
        {leftSidebar && (
          <div style={{ 
            width: '280px', 
            borderRight: '1px solid #e5e7eb',
            overflow: 'auto',
            flexShrink: 0
          }}>
            {leftSidebar}
          </div>
        )}
        
        {/* Main Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {children}
        </div>
        
        {/* Right Panel */}
        {rightPanel && (
          <div style={{ 
            width: '400px', 
            borderLeft: '1px solid #e5e7eb',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  );
}


