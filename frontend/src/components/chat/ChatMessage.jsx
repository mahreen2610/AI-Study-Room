import React from 'react';
import useAuth from '../../hooks/useAuth';

export default function ChatMessage({ message }) {
  const { user } = useAuth();
  const isMe = message.user_id === user?.id;

  // Format time (e.g. "10:15 AM")
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: isMe ? 'flex-end' : 'flex-start',
        width: '100%',
        margin: '8px 0',
        padding: '0 8px',
        animation: 'slide-in 0.2s ease-out forwards'
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'baseline', 
          gap: '8px', 
          marginBottom: '4px',
          fontSize: '0.75rem'
        }}
      >
        <span style={{ fontWeight: '600', color: isMe ? 'var(--accent-purple)' : 'var(--text-secondary)' }}>
          {isMe ? 'You' : message.username}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          {formatTime(message.created_at)}
        </span>
      </div>

      <div 
        style={{ 
          maxWidth: '80%', 
          padding: '10px 14px', 
          borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
          background: isMe 
            ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' 
            : 'rgba(255, 255, 255, 0.05)',
          border: isMe ? 'none' : '1px solid var(--border-color)',
          color: '#fff',
          fontSize: '0.9rem',
          lineHeight: '1.4',
          wordBreak: 'break-word',
          boxShadow: isMe ? '0 4px 10px rgba(124, 58, 237, 0.15)' : 'none'
        }}
      >
        {message.content}
      </div>
    </div>
  );
}
