import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle } from 'lucide-react';

export default function FileUpload({ onUpload, uploading }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith('.pdf')) {
      setError("Only PDF files are supported");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit");
      return;
    }

    setError(null);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err.message || "Failed to upload file");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        style={{
          border: dragActive 
            ? '2px dashed var(--accent-indigo)' 
            : '1px dashed var(--border-color)',
          background: dragActive 
            ? 'rgba(99, 102, 241, 0.05)' 
            : 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          padding: '24px 16px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all var(--transition-fast)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minHeight: '120px'
        }}
        className="hover:border-indigo-400"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleChange}
          style={{ display: 'none' }}
          disabled={uploading}
        />

        {uploading ? (
          <>
            <div className="spinner"></div>
            <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Uploading PDF...
            </span>
          </>
        ) : (
          <>
            <UploadCloud size={28} color={dragActive ? "var(--accent-indigo)" : "var(--text-muted)"} />
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>
                Drag & drop your study PDF
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                or click to browse (Max 10MB)
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            color: '#ef4444', 
            fontSize: '0.75rem', 
            padding: '6px 8px',
            background: 'rgba(239, 68, 68, 0.08)',
            borderRadius: '6px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
