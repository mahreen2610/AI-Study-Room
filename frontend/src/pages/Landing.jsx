import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { BookOpen, Sparkles, Users, BrainCircuit, ArrowRight } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        background: 'radial-gradient(circle at top left, rgba(99, 102, 241, 0.15), transparent 40%), radial-gradient(circle at bottom right, rgba(139, 92, 246, 0.12), transparent 40%), var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '80px 24px 60px 24px',
        overflowY: 'auto'
      }}
    >
      <div 
        style={{ 
          maxWidth: '800px', 
          width: '100%', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}
      >
        {/* Logo Icon */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-indigo) 100%)',
            boxShadow: 'var(--shadow-glow)',
            color: '#fff',
            marginBottom: '8px'
          }}
          className="animate-pulse-glow"
        >
          <BookOpen size={30} />
        </div>

        {/* Title */}
        <h1 
          style={{ 
            fontSize: '3.5rem', 
            fontWeight: '800', 
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
            margin: 0
          }}
        >
          Study Smarter with{' '}<br />
          <span className="gradient-text">AI-Powered Study Rooms</span>
        </h1>

        {/* Subtitle */}
        <p 
          style={{ 
            fontSize: '1.15rem', 
            color: 'var(--text-secondary)',
            maxWidth: '560px',
            lineHeight: '1.6',
            margin: '0 auto'
          }}
        >
          Upload your PDFs, chat in real-time with your study group, and get instant answers from a powerful AI assistant context-trained on your study materials.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
          {user ? (
            <button 
              className="btn-primary" 
              onClick={() => navigate('/dashboard')}
              style={{ fontSize: '1rem', padding: '14px 28px' }}
            >
              Go to Dashboard <ArrowRight size={18} />
            </button>
          ) : (
            <>
              <button 
                className="btn-primary" 
                onClick={() => navigate('/signup')}
                style={{ fontSize: '1rem', padding: '14px 28px' }}
              >
                Get Started
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => navigate('/login')}
                style={{ fontSize: '1rem', padding: '14px 28px' }}
              >
                Sign In
              </button>
            </>
          )}
        </div>

        {/* Feature Grid */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '20px', 
            width: '100%',
            marginTop: '60px'
          }}
        >
          {/* Feature 1 */}
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: 'var(--accent-indigo)', display: 'inline-flex', padding: '8px', background: 'rgba(99,102,241,0.08)', borderRadius: '8px' }}>
              <Users size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Real-time Group Chat</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Discuss study topics with your teammates instantly using Supabase Realtime synchronization.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: 'var(--accent-purple)', display: 'inline-flex', padding: '8px', background: 'rgba(139,92,246,0.08)', borderRadius: '8px' }}>
              <BookOpen size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Smart PDF Indexing</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Upload textbooks, notes, and study slides. Our backend parses, chunks, and indexes them using vector embeddings.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: 'var(--accent-teal)', display: 'inline-flex', padding: '8px', background: 'rgba(20,184,166,0.08)', borderRadius: '8px' }}>
              <BrainCircuit size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>AI RAG Assistant</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Ask questions directly. The bot fetches exact passages from your materials and answers instantly using advanced AI models.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
