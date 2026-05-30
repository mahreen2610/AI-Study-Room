import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import useRoom from '../hooks/useRoom';
import RoomCard from '../components/room/RoomCard';
import { LogOut, Plus, LogIn, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const { rooms, loading, error, fetchRooms, createRoom, joinRoom } = useRoom();

  // Create Room Form State
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Join Room Form State
  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState(null);

  // Success notifications
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const showToast = (message) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setCreateLoading(true);
    setCreateError(null);
    try {
      const room = await createRoom(createName.trim(), createDesc.trim());
      setCreateName('');
      setCreateDesc('');
      showToast(`Room "${room.name}" created successfully!`);
    } catch (err) {
      setCreateError(err.response?.data?.error || err.message || 'Failed to create room');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim() || inviteCode.trim().length !== 8) {
      setJoinError('Invite code must be exactly 8 characters');
      return;
    }

    setJoinLoading(true);
    setJoinError(null);
    try {
      const room = await joinRoom(inviteCode.trim().toUpperCase());
      setInviteCode('');
      showToast(`Successfully joined room "${room.name}"!`);
    } catch (err) {
      setJoinError(err.response?.data?.error || err.message || 'Failed to join room');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Top Navbar */}
      <header 
        style={{ 
          background: 'var(--bg-secondary)', 
          borderBottom: '1px solid var(--border-color)',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px'
        }}
      >
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            width: '100%',
            maxWidth: '1200px', 
            margin: '0 auto' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center' }}>
              <BookOpen size={24} />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', tracking: '-0.02em', background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              StudyRoom AI
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff' }}>
                {profile?.username || 'Loading...'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Student Profile</span>
            </div>
            <button 
              className="btn-secondary" 
              onClick={signOut} 
              style={{ padding: '8px 12px', fontSize: '0.8rem', gap: '6px', height: '36px', borderRadius: '8px' }}
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1200px', width: '100%', margin: '0 auto', overflowY: 'auto' }}>
        
        {/* Welcome Dashboard Banner */}
        <div 
          className="glass-panel p-8"
          style={{ 
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
              Hello, <span className="gradient-text">{profile?.username || 'Scholar'}</span>!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '600px', lineHeight: '1.5' }}>
              Welcome back to your study headquarters. Collaborate in real-time with your peers and let the AI analyze your study documents to solve complex topics.
            </p>
          </div>
        </div>

        {/* Layout split: Rooms catalog / Room Controls */}
        <div className="dashboard-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
          
          {/* Rooms Grid */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', marginBottom: '20px' }}>
              Your Study Rooms
            </h3>

            {error && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem', color: '#ef4444', marginBottom: '20px', background: 'rgba(239,68,68,0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={16} />
                <span>Failed to connect to backend: {error}. Make sure the backend is running.</span>
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <div className="spinner"></div>
              </div>
            ) : rooms.length === 0 ? (
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '60px 24px', 
                  textAlign: 'center', 
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '50%' }}>
                  <BookOpen size={36} color="var(--text-muted)" />
                </div>
                <div>
                  <p style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '1.05rem' }}>No rooms found</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Create a new study room or use an invite code to join a peer's room.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {rooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Room Control Forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Join Room Form */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogIn size={16} color="var(--accent-teal)" /> Join with Invite Code
              </h4>

              {joinError && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', color: '#ef4444', marginBottom: '12px', background: 'rgba(239,68,68,0.08)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle size={14} />
                  <span>{joinError}</span>
                </div>
              )}

              <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input
                  type="text"
                  placeholder="Invite Code (e.g. 3C8F9A1D)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  maxLength={8}
                  disabled={joinLoading}
                  style={{ textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.05em', fontFamily: 'monospace' }}
                  required
                />
                <button type="submit" className="btn-primary w-full" disabled={joinLoading || inviteCode.trim().length !== 8}>
                  {joinLoading ? <span className="spinner"></span> : 'Join Study Room'}
                </button>
              </form>
            </div>

            {/* Create Room Form */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} color="var(--accent-indigo)" /> Create a Room
              </h4>

              {createError && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', color: '#ef4444', marginBottom: '12px', background: 'rgba(239,68,68,0.08)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle size={14} />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Room Name</label>
                  <input
                    type="text"
                    placeholder="E.g. Computer Science 101"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    disabled={createLoading}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Description (Optional)</label>
                  <textarea
                    placeholder="Define subjects, team members, or topics..."
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    disabled={createLoading}
                    rows={3}
                    style={{ resize: 'none' }}
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={createLoading || !createName.trim()}>
                  {createLoading ? <span className="spinner"></span> : 'Create Room'}
                </button>
              </form>
            </div>

          </div>

        </div>
      </main>

      {/* Toast Notification */}
      {successMsg && (
        <div className="toast-notification toast-success">
          <CheckCircle size={18} color="var(--accent-teal)" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
