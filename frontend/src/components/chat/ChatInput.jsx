import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function ChatInput({ onSendMessage, placeholder = "Type a message..." }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      style={{ 
        display: 'flex', 
        gap: '10px', 
        padding: '16px 20px', 
        background: 'transparent', 
        alignItems: 'center'
      }}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '0.9rem',
          height: '42px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          color: '#fff',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all var(--transition-fast)'
        }}
      />
      <button 
        type="submit" 
        style={{ 
          width: '42px', 
          height: '42px', 
          borderRadius: '12px', 
          flexShrink: 0,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: text.trim() ? 'pointer' : 'not-allowed',
          background: text.trim() 
            ? 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-indigo) 100%)' 
            : 'rgba(255, 255, 255, 0.04)',
          color: text.trim() ? '#fff' : 'var(--text-muted)',
          boxShadow: text.trim() ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none',
          transition: 'all var(--transition-fast)'
        }}
        disabled={!text.trim()}
      >
        <Send size={16} />
      </button>
    </form>
  );
}
