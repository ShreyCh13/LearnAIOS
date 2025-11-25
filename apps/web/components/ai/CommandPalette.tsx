'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/apiClient';

interface Tool {
  name: string;
  displayName: string;
  description: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  courseId?: string;
  moduleId?: string;
  pageId?: string;
  onSendMessage?: (message: string, toolHint?: string, questionCount?: number) => void;
}

export function CommandPalette({ 
  open, 
  onClose, 
  courseId,
  moduleId, 
  pageId,
  onSendMessage 
}: CommandPaletteProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch tools when palette opens
  useEffect(() => {
    if (open) {
      fetchTools();
      setSearchQuery('');
      setSelectedIndex(0);
      // Focus input after a brief delay to ensure modal is rendered
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Filter tools based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTools(tools);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = tools.filter(
        (tool) =>
          tool.displayName.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query)
      );
      setFilteredTools(filtered);
    }
    setSelectedIndex(0);
  }, [searchQuery, tools]);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(
        '/api/ai/tools?agentName=content_helper&contextType=course_page'
      );
      if (response.ok) {
        const data = await response.json();
        setTools(data.tools || []);
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTool = async (tool: Tool) => {
    // Special handling for generate_practice_questions
    if (tool.name === 'generate_practice_questions') {
      const questionCountStr = window.prompt('How many questions would you like to generate?', '5');
      
      if (questionCountStr === null) {
        // User cancelled
        return;
      }

      const questionCount = parseInt(questionCountStr, 10) || 5;

      // Call the onSendMessage callback with special parameters
      if (onSendMessage && courseId && pageId) {
        onSendMessage(
          `Generate ${questionCount} practice questions for this module.`,
          'generate_practice_questions',
          questionCount
        );
      }
    } 
    // Special handling for summarize_module
    else if (tool.name === 'summarize_module') {
      if (onSendMessage && moduleId) {
        onSendMessage(
          'Summarize this module.',
          'summarize_module'
        );
      } else if (!moduleId) {
        alert('Please navigate to a module page to use this feature.');
        return;
      }
    }

    // Close the palette
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < filteredTools.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTools[selectedIndex]) {
        handleSelectTool(filteredTools[selectedIndex]);
      }
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '600px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {/* Search Input */}
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for tools and commands..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: 'none',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Tools List */}
        <div
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
              Loading tools...
            </div>
          ) : filteredTools.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
              {searchQuery ? 'No tools found matching your search.' : 'No tools available.'}
            </div>
          ) : (
            filteredTools.map((tool, index) => (
              <div
                key={tool.name}
                onClick={() => handleSelectTool(tool)}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  backgroundColor: index === selectedIndex ? '#f3f4f6' : '#fff',
                  borderBottom: index < filteredTools.length - 1 ? '1px solid #f3f4f6' : 'none',
                  transition: 'background-color 0.15s',
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '4px' }}>
                  {tool.displayName}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  {tool.description}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            fontSize: '12px',
            color: '#6b7280',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>↑↓ Navigate • Enter Select • Esc Close</span>
        </div>
      </div>
    </>
  );
}

