import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users } from 'lucide-react';

export default function RoomHeader({ room, onInviteClick }) {
  const navigate = useNavigate();

  return (
    <header 
      className="room-header"
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 24px', 
        background: 'var(--bg-secondary)', 
        borderBottom: '1px solid var(--border-color)',
        height: '70px'
      }}
    >
      <div className="room-header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          className="btn-icon" 
          onClick={() => navigate('/dashboard')}
          title="Back to Dashboard"
          style={{ width: '36px', height: '36px', borderRadius: '8px' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {room.name}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {room.description || 'No description provided'}
          </p>
        </div>
      </div>

      <div className="room-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontSize: '0.85rem', 
            color: 'var(--text-secondary)',
            background: 'rgba(255,255,255,0.03)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}
        >
          <Users size={16} color="var(--accent-indigo)" />
          <span>{room.members?.length || 0} member{room.members?.length !== 1 && 's'}</span>
        </div>

        <button 
          className="btn-primary" 
          onClick={onInviteClick}
          style={{ padding: '6px 14px', fontSize: '0.8rem', height: '34px', borderRadius: '8px', gap: '6px' }}
        >
          <UserPlus size={14} />
          Invite
        </button>
      </div>
    </header>
  );
}
