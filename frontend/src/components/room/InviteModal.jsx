import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

export default function InviteModal({ isOpen, onClose, room }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !room) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(room.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '24px',
          position: 'relative',
          animation: 'slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            transition: 'color var(--transition-fast)'
          }}
          className="hover:text-white"
        >
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>
          Invite Members
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Share this unique invite code with your peers. Anyone with this code can join this study room.
        </p>

        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px', 
            background: 'rgba(255,255,255,0.02)',
            padding: '16px', 
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            alignItems: 'center',
            marginBottom: '20px'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)' }}>
            Room Invite Code
          </span>
          <div 
            style={{ 
              fontSize: '2rem', 
              fontWeight: '800', 
              letterSpacing: '0.1em', 
              color: 'var(--accent-indigo)',
              fontFamily: 'monospace'
            }}
          >
            {room.invite_code}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-primary" 
            onClick={handleCopy}
            style={{ flex: 1, gap: '8px' }}
          >
            {copied ? (
              <>
                <Check size={16} /> Copied!
              </>
            ) : (
              <>
                <Copy size={16} /> Copy Code
              </>
            )}
          </button>
          <button 
            className="btn-secondary" 
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
