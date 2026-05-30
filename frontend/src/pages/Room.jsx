import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useRoom from '../hooks/useRoom';
import useChat from '../hooks/useChat';
import useDocuments from '../hooks/useDocuments';
import RoomHeader from '../components/room/RoomHeader';
import InviteModal from '../components/room/InviteModal';
import ChatWindow from '../components/chat/ChatWindow';
import AIChatWindow from '../components/ai/AIChatWindow';
import FileUpload from '../components/upload/FileUpload';
import DocumentList from '../components/upload/DocumentList';
import { FileUp, BookOpen, AlertTriangle, MessageSquare, Sparkles } from 'lucide-react';

export default function Room() {
  const { roomId } = useParams();
  const { currentRoom, loading: roomLoading, error: roomError, fetchRoomDetails } = useRoom();
  const { messages, humanLoading, sendHumanMessage, aiMessages, aiLoading, aiStreamingText, askAI } = useChat(roomId);
  const { documents, loading: docsLoading, uploading: docsUploading, uploadDocument } = useDocuments(roomId);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [errorToast, setErrorToast] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'docs', 'chat', 'ai'

  // Track document states to trigger notifications (e.g. from processing -> ready)
  const [prevDocStatuses, setPrevDocStatuses] = useState({});

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails(roomId);
    }
  }, [roomId, fetchRoomDetails]);

  // Proactive indexing updates check
  useEffect(() => {
    if (!documents || documents.length === 0) return;
    
    documents.forEach((doc) => {
      const prevStatus = prevDocStatuses[doc.id];
      if (prevStatus === 'processing' && doc.status === 'ready') {
        showSuccessToast(`"${doc.name}" is processed & ready for AI questioning!`);
      } else if (prevStatus === 'processing' && doc.status === 'failed') {
        showErrorToast(`AI indexing failed for "${doc.name}"`);
      }
    });

    // Update statuses cache
    const currentStatuses = {};
    documents.forEach((doc) => {
      currentStatuses[doc.id] = doc.status;
    });
    setPrevDocStatuses(currentStatuses);
  }, [documents]);

  const showSuccessToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const showErrorToast = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4000);
  };

  const handleDocUpload = async (file) => {
    try {
      showSuccessToast(`Uploading "${file.name}"...`);
      await uploadDocument(file);
      showSuccessToast(`Uploaded "${file.name}" successfully. Ingesting text...`);
    } catch (err) {
      showErrorToast(err.message || 'File upload failed');
    }
  };

  if (roomLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (roomError || !currentRoom) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)', gap: '16px', padding: '24px', textAlign: 'center' }}>
        <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '16px', borderRadius: '50%' }}>
          <AlertTriangle size={36} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '0.9rem' }}>
          {roomError || "We couldn't retrieve the details for this study room. Make sure you are a member and try again."}
        </p>
        <a href="/dashboard" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
          Back to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* Room Top Header bar */}
      <RoomHeader 
        room={currentRoom} 
        onInviteClick={() => setIsInviteOpen(true)} 
      />

      {/* Tri-Panel Panel Workspace layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Side Panel - Document Workspace */}
        <aside 
          className={`room-sidebar ${activeTab === 'docs' ? 'active' : ''}`}
          style={{ 
            width: 'var(--sidebar-width)', 
            background: 'var(--bg-primary)', 
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '20px',
            overflowY: 'auto',
            flexShrink: 0
          }}
        >
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', tracking: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileUp size={14} /> Add Materials
            </h4>
            <FileUpload 
              onUpload={handleDocUpload} 
              uploading={docsUploading} 
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

          <DocumentList 
            documents={documents} 
            loading={docsLoading} 
          />
        </aside>

        {/* Central columns (Human Chat + AI Chat split) */}
        <div className="room-main-container" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Middle Column - Human Chat */}
          <div className={`room-human-chat ${activeTab === 'chat' ? 'active' : ''}`} style={{ flex: 1, height: '100%' }}>
            <ChatWindow 
              messages={messages} 
              loading={humanLoading} 
              onSendMessage={sendHumanMessage} 
            />
          </div>

          {/* Right Column - AI Chat */}
          <div className={`room-ai-chat ${activeTab === 'ai' ? 'active' : ''}`} style={{ flex: 1, height: '100%' }}>
            <AIChatWindow 
              messages={aiMessages} 
              loading={aiLoading} 
              streamingText={aiStreamingText} 
              onSendMessage={askAI} 
            />
          </div>
        </div>

      </div>

      {/* Mobile Tab Switching Bar */}
      <div className="mobile-tab-bar">
        <button 
          onClick={() => setActiveTab('docs')} 
          className={`mobile-tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
        >
          <BookOpen size={18} />
          <span>Materials</span>
        </button>
        <button 
          onClick={() => setActiveTab('chat')} 
          className={`mobile-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
        >
          <MessageSquare size={18} />
          <span>Group Chat</span>
        </button>
        <button 
          onClick={() => setActiveTab('ai')} 
          className={`mobile-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
        >
          <Sparkles size={18} />
          <span>AI Chat</span>
        </button>
      </div>

      {/* Invite Modal */}
      <InviteModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        room={currentRoom} 
      />

      {/* Success Toast */}
      {successToast && (
        <div className="toast-notification toast-success">
          <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderLeftColor: 'var(--accent-teal)' }}></div>
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div className="toast-notification toast-error">
          <AlertTriangle size={18} color="#ef4444" />
          <span>{errorToast}</span>
        </div>
      )}
    </div>
  );
}
