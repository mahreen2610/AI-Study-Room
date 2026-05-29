import React from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FileText, ExternalLink, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DocumentList({ documents, loading }) {

  const getFileUrl = (storagePath) => {
    // Generate public URL for viewing the original PDF
    const { data } = supabase.storage.from('documents').getPublicUrl(storagePath);
    return data?.publicUrl || '#';
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
      <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', tracking: '0.05em' }}>
        Study Materials ({documents.length})
      </h4>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
          <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
        </div>
      ) : documents.length === 0 ? (
        <div 
          style={{ 
            padding: '20px 12px', 
            textAlign: 'center', 
            background: 'rgba(255,255,255,0.01)', 
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            fontSize: '0.8rem'
          }}
        >
          No study files uploaded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {documents.map((doc) => {
            const isProcessing = doc.status === 'processing';
            const isReady = doc.status === 'ready';
            const isFailed = doc.status === 'failed';

            return (
              <div 
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  transition: 'border-color var(--transition-fast)'
                }}
                className="hover:border-gray-800"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <div 
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: isReady ? 'rgba(20, 184, 166, 0.1)' : isFailed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                      color: isReady ? 'var(--accent-teal)' : isFailed ? '#ef4444' : 'var(--accent-purple)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <FileText size={16} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <p 
                      style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: '600', 
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={doc.name}
                    >
                      {doc.name}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Uploaded by {doc.uploaded_by_username}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {/* Status Indicator badge */}
                  {isProcessing && (
                    <span 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.65rem',
                        color: 'var(--accent-purple)',
                        background: 'rgba(139, 92, 246, 0.12)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}
                    >
                      <RefreshCw size={10} style={{ animation: 'spin 1.5s linear infinite' }} />
                      Indexing
                    </span>
                  )}

                  {isFailed && (
                    <span 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.65rem',
                        color: '#ef4444',
                        background: 'rgba(239, 68, 68, 0.12)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}
                    >
                      <AlertTriangle size={10} />
                      Failed
                    </span>
                  )}

                  {isReady && (
                    <>
                      <a 
                        href={getFileUrl(doc.storage_path)} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                          borderRadius: '4px',
                          transition: 'color 0.2s'
                        }}
                        className="hover:text-white"
                        title="Open PDF"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <span 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.65rem',
                          color: 'var(--accent-teal)',
                          background: 'rgba(20, 184, 166, 0.12)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}
                      >
                        <CheckCircle size={10} />
                        Ready
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
