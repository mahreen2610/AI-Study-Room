import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Copy, Check, Shield } from 'lucide-react';

export default function RoomCard({ room }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const copyInviteCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(room.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={() => navigate(`/rooms/${room.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-secondary)',
        border: hovered ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '220px',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered 
          ? '0 12px 30px rgba(0, 0, 0, 0.4), 0 0 20px -3px rgba(99, 102, 241, 0.25)' 
          : 'var(--shadow-md)',
        transition: 'all var(--transition-normal)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '12px', 
                background: 'rgba(99, 102, 241, 0.12)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--accent-indigo)',
                flexShrink: 0
              }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', margin: 0, lineHeight: '1.3' }}>{room.name}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Created {new Date(room.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {room.role === 'owner' ? (
            <span 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px',
                fontSize: '0.7rem', 
                fontWeight: '700', 
                color: 'var(--accent-purple)', 
                background: 'rgba(139, 92, 246, 0.12)', 
                padding: '4px 10px', 
                borderRadius: '99px',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                flexShrink: 0
              }}
            >
              <Shield size={10} /> Owner
            </span>
          ) : (
            <span 
              style={{ 
                display: 'inline-flex', 
                fontSize: '0.7rem', 
                fontWeight: '700', 
                color: 'var(--accent-teal)', 
                background: 'rgba(20, 184, 166, 0.12)', 
                padding: '4px 10px', 
                borderRadius: '99px',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                flexShrink: 0
              }}
            >
              Member
            </span>
          )}
        </div>

        <p 
          style={{ 
            fontSize: '0.875rem', 
            color: room.description ? 'var(--text-secondary)' : 'var(--text-muted)', 
            fontStyle: room.description ? 'normal' : 'italic',
            margin: '0 0 20px 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '1.5'
          }}
        >
          {room.description || 'No description provided for this study room.'}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
        <button 
          onClick={copyInviteCode}
          className="btn-secondary" 
          style={{ 
            padding: '6px 12px', 
            fontSize: '0.75rem', 
            gap: '8px', 
            height: '34px', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Copy invite code to clipboard"
        >
          {copied ? <Check size={12} color="var(--accent-teal)" /> : <Copy size={12} />}
          <span style={{ fontFamily: 'monospace', fontWeight: '600', letterSpacing: '0.05em' }}>
            {room.invite_code}
          </span>
        </button>

        <button 
          className="btn-primary" 
          style={{ padding: '6px 16px', fontSize: '0.8rem', height: '34px', borderRadius: '8px', fontWeight: '600' }}
        >
          Enter Room
        </button>
      </div>
    </div>
  );
}
