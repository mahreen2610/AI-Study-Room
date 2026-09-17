import React, { useEffect, useRef } from 'react';
import AIChatMessage from './AIChatMessage';
import ChatInput from '../chat/ChatInput';
import { Sparkles, BrainCircuit } from 'lucide-react';

export default function AIChatWindow({ messages, loading, streamingText, onSendMessage }) {
  const scrollRef = useRef(null);
  const prevMessagesLength = useRef(messages.length);

  const scrollToBottom = (behavior = 'smooth') => {
    const container = scrollRef.current;
    if (!container) return;

    if (behavior === 'smooth') {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Detect if user has just submitted a new message
    const messagesExpanded = messages.length > prevMessagesLength.current;
    prevMessagesLength.current = messages.length;

    if (messagesExpanded) {
      scrollToBottom('auto');
      return;
    }

    // If streaming, only auto-scroll if the user is already near the bottom
    const threshold = 150;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;

    if (isNearBottom) {
      scrollToBottom('smooth');
    }
  }, [messages, streamingText]);

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        background: 'var(--bg-secondary)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-secondary)',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--accent-teal)" />
          <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>AI RAG Assistant</span>
        </div>
        <span 
          style={{ 
            fontSize: '0.7rem', 
            color: 'var(--accent-teal)', 
            background: 'rgba(20, 184, 166, 0.12)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontWeight: '600'
          }}
        >
          Gemini 1.5 Flash
        </span>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '16px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {messages.length === 0 && !streamingText ? (
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'var(--text-muted)',
              gap: '12px',
              textAlign: 'center',
              padding: '24px'
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '50%' }}>
              <BrainCircuit size={24} color="var(--accent-teal)" />
            </div>
            <div>
              <p style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>Ask the AI Assistant</p>
              <p style={{ fontSize: '0.8rem' }}>Upload study materials, and ask questions. The AI will answer based on your documents!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <AIChatMessage key={msg.id} message={msg} />
            ))}

            {/* SSE Streaming Active Chunk */}
            {streamingText && (
              <AIChatMessage 
                message={{
                  id: 'streaming-assistant',
                  role: 'assistant',
                  content: streamingText,
                  created_at: new Date().toISOString()
                }} 
              />
            )}

            {/* Loading Indicator */}
            {loading && !streamingText && (
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'center', 
                  padding: '8px 16px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem'
                }}
              >
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                <span>AI is thinking...</span>
              </div>
            )}
          </>
        )}
      </div>

      <ChatInput 
        onSendMessage={onSendMessage} 
        placeholder="Ask AI about study materials..." 
        disabled={loading}
      />
    </div>
  );
}
