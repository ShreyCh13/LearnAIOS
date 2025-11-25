'use client';

import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '@/lib/apiClient';

interface Message {
  sender: 'user' | 'agent';
  content: string;
}

interface AIChatPanelProps {
  courseId: string;
  moduleId?: string;
  pageId: string;
  onRegisterSendMessage?: (sendFn: (message: string, toolHint?: string, questionCount?: number) => void) => void;
}

export function AIChatPanel({ courseId, moduleId, pageId, onRegisterSendMessage }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'agent',
      content: 'Hi! I\'m your content helper. Ask me anything about this course material.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset conversation when courseId, moduleId, or pageId changes
  useEffect(() => {
    setConversationId(null);
    setMessages([
      {
        sender: 'agent',
        content: 'Hi! I\'m your content helper. Ask me anything about this course material.',
      },
    ]);
  }, [courseId, moduleId, pageId]);

  // Register the send message function with parent
  useEffect(() => {
    if (onRegisterSendMessage) {
      onRegisterSendMessage(handleSendMessage);
    }
  }, [onRegisterSendMessage]);

  const handleSendMessage = async (message: string, toolHint?: string, questionCount?: number) => {
    if (!message.trim() || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: 'user', content: message }]);
    setLoading(true);

    try {
      // Build request body with conversationId if available
      const body: any = {
        agentName: 'content_helper',
        message: message,
        courseId,
        pageId,
      };
      if (moduleId) {
        body.moduleId = moduleId;
      }
      if (conversationId) {
        body.conversationId = conversationId;
      }
      // Add optional tool hint and question count for command palette requests
      if (toolHint) {
        body.toolHint = toolHint;
      }
      if (questionCount) {
        body.questionCount = questionCount;
      }

      const response = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Store conversationId if this is a new conversation
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
      
      // Add agent response
      setMessages((prev) => [
        ...prev,
        { sender: 'agent', content: data.reply || 'Sorry, I could not process that.' },
      ]);
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'agent', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    await handleSendMessage(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      backgroundColor: '#f9fafb'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#fff'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
          AI Content Helper
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
          Ask questions about the course material
        </p>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: msg.sender === 'user' ? '#4f46e5' : '#fff',
                color: msg.sender === 'user' ? '#fff' : '#374151',
                fontSize: '14px',
                lineHeight: '1.5',
                boxShadow: msg.sender === 'agent' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#fff',
                color: '#6b7280',
                fontSize: '14px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ 
        padding: '16px', 
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#fff'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              resize: 'none',
              minHeight: '60px',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: loading || !input.trim() ? '#e5e7eb' : '#4f46e5',
              color: '#fff',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

