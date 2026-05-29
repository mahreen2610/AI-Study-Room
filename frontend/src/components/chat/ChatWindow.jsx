import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { MessageSquare } from 'lucide-react';

export default function ChatWindow({ messages, loading, onSendMessage }) {
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}
    >
      <div 
        style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-secondary)'
        }}
      >
        <MessageSquare size={16} color="var(--accent-indigo)" />
        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Human Chat</span>
      </div>

      <div 
        ref={scrollRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <div className="spinner"></div>
          </div>
        ) : messages.length === 0 ? (
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'var(--text-muted)',
              gap: '12px',
              textAlign: 'center',
              padding: '24px'
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '50%' }}>
              <MessageSquare size={24} />
            </div>
            <div>
              <p style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>No messages yet</p>
              <p style={{ fontSize: '0.8rem' }}>Say hello to start the discussion!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
      </div>

      <ChatInput onSendMessage={onSendMessage} placeholder="Message study group..." />
    </div>
  );
}
