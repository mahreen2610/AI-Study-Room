import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import api from '../lib/api';

/**
 * Custom hook to manage room study documents.
 */
export default function useDocuments(roomId) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch documents in the room
  const fetchDocuments = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/rooms/${roomId}/documents`);
      setDocuments(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // 2. Setup Realtime subscription to watch document status changes (e.g., processing -> ready)
  useEffect(() => {
    if (!roomId) return;

    fetchDocuments();

    const channel = supabase
      .channel(`room_docs_status:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // listen to inserts, updates, deletes
          schema: 'public',
          table: 'documents',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          // Simplest and most robust approach is to reload the doc list
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchDocuments]);

  // 3. Upload a new PDF document
  const uploadDocument = useCallback(async (file) => {
    if (!roomId || !file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/rooms/${roomId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      // Append the temporary processing document to the state list
      setDocuments((prev) => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setUploading(false);
    }
  }, [roomId]);

  return {
    documents,
    loading,
    uploading,
    error,
    fetchDocuments,
    uploadDocument
  };
}
