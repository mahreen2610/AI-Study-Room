import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        background: 'radial-gradient(circle at top left, rgba(99, 102, 241, 0.08), transparent 40%), var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        position: 'relative'
      }}
    >
      {/* Back button */}
      <Link 
        to="/" 
        style={{ 
          position: 'absolute', 
          top: '24px', 
          left: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '0.9rem',
          fontWeight: '500',
          transition: 'color var(--transition-fast)'
        }}
        className="hover:text-white"
      >
        <ArrowLeft size={16} /> Back to home
      </Link>

      <LoginForm />
    </div>
  );
}
