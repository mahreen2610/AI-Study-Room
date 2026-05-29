import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        textAlign: 'center',
        gap: '16px'
      }}
    >
      <div style={{ color: 'var(--accent-indigo)', background: 'rgba(99, 102, 241, 0.1)', padding: '20px', borderRadius: '50%' }}>
        <HelpCircle size={48} />
      </div>
      <h1 style={{ fontSize: '3rem', fontWeight: '800', margin: 0 }} className="gradient-text">404</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '360px', fontSize: '0.9rem', lineHeight: '1.5' }}>
        The page you are looking for doesn't exist or has been moved. Let's get you back to studying.
      </p>
      <button 
        className="btn-primary" 
        onClick={() => navigate('/')} 
        style={{ padding: '10px 20px', borderRadius: '8px', gap: '8px', marginTop: '12px' }}
      >
        <ArrowLeft size={16} /> Back to Safety
      </button>
    </div>
  );
}
