import React from 'react';
import { Cpu, User } from 'lucide-react';

export default function AIChatMessage({ message }) {
  const isAI = message.role === 'assistant';

  // Format time
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Basic markdown-to-HTML parser for bullet points, bolding, and paragraphs
  const renderFormattedContent = (content) => {
    if (!content) return '';
    
    // Split by newlines
    const lines = content.split('\n');
    return lines.map((line, index) => {
      let trimmed = line.trim();
      
      // Handle headers (### Header)
      if (trimmed.startsWith('###')) {
        return <h4 key={index} style={{ fontWeight: '700', margin: '10px 0 6px 0', fontSize: '0.95rem', color: '#fff' }}>{trimmed.replace(/^###\s*/, '')}</h4>;
      }
      if (trimmed.startsWith('##')) {
        return <h3 key={index} style={{ fontWeight: '700', margin: '12px 0 6px 0', fontSize: '1.05rem', color: '#fff' }}>{trimmed.replace(/^##\s*/, '')}</h3>;
      }
      
      // Handle bullet lists
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const text = trimmed.slice(2);
        return (
          <ul key={index} style={{ paddingLeft: '20px', listStyleType: 'disc', margin: '4px 0' }}>
            <li>{parseBoldText(text)}</li>
          </ul>
        );
      }

      // Default paragraph
      return (
        <p key={index} style={{ margin: '6px 0', minHeight: '1.2em' }}>
          {parseBoldText(line)}
        </p>
      );
    });
  };

  // Helper to parse **bold** text
  const parseBoldText = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} style={{ fontWeight: '700', color: 'var(--accent-teal)' }}>{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        gap: '12px',
        margin: '16px 0',
        padding: '0 8px',
        flexDirection: 'row',
        alignItems: 'flex-start',
        animation: 'slide-in 0.2s ease-out forwards',
        width: '100%'
      }}
    >
      {/* Avatar Icon */}
      <div 
        style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          background: isAI 
            ? 'rgba(20, 184, 166, 0.15)' 
            : 'rgba(99, 102, 241, 0.15)',
          color: isAI ? 'var(--accent-teal)' : 'var(--accent-indigo)'
        }}
      >
        {isAI ? <Cpu size={16} /> : <User size={16} />}
      </div>

      {/* Message Content Container */}
      <div style={{ flex: 1 }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'baseline', 
            gap: '8px', 
            marginBottom: '4px',
            fontSize: '0.75rem'
          }}
        >
          <span style={{ fontWeight: '600', color: '#fff' }}>
            {isAI ? 'AI Study Assistant' : 'You (AI Inquiry)'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            {formatTime(message.created_at)}
          </span>
        </div>

        <div 
          style={{ 
            padding: '12px 16px', 
            borderRadius: '12px',
            background: isAI 
              ? 'rgba(20, 184, 166, 0.04)' 
              : 'rgba(255, 255, 255, 0.02)',
            border: isAI 
              ? '1px solid rgba(20, 184, 166, 0.2)' 
              : '1px solid var(--border-color)',
            color: '#fff',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            wordBreak: 'break-word',
            boxShadow: isAI ? '0 4px 15px rgba(20, 184, 166, 0.03)' : 'none'
          }}
        >
          {renderFormattedContent(message.content)}
        </div>
      </div>
    </div>
  );
}
