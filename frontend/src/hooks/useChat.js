import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import api from '../lib/api';

/**
 * Custom hook to handle Human Chat (Realtime) and AI RAG Chat (SSE Streaming).
 */
export default function useChat(roomId) {
  // Human Chat State
  const [messages, setMessages] = useState([]);
  const [humanLoading, setHumanLoading] = useState(false);

  // AI Chat State
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStreamingText, setAiStreamingText] = useState('');

  // Cache user profiles to avoid repeated database lookups
  const profileCache = useRef({});

  // 1. Fetch Human Messages
  const fetchHumanMessages = useCallback(async () => {
    if (!roomId) return;
    setHumanLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(username)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formatted = data.map((msg) => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        user_id: msg.user_id,
        username: msg.profiles?.username || 'Unknown'
      }));

      setMessages(formatted);
    } catch (error) {
      console.error('Error fetching human messages:', error);
    } finally {
      setHumanLoading(false);
    }
  }, [roomId]);

  // 2. Fetch AI Messages
  const fetchAIHistory = useCallback(async () => {
    if (!roomId) return;
    setAiLoading(true);
    try {
      const res = await api.get(`/rooms/${roomId}/ai/history`);
      setAiMessages(res.data);
    } catch (error) {
      console.error('Error fetching AI history:', error);
    } finally {
      setAiLoading(false);
    }
  }, [roomId]);

  // Helper to resolve usernames
  const getUserProfile = async (userId) => {
    if (profileCache.current[userId]) {
      return profileCache.current[userId];
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();
      
      const username = !error && data ? data.username : 'Unknown';
      profileCache.current[userId] = username;
      return username;
    } catch {
      return 'Unknown';
    }
  };

  // 3. Subscribe to Human Messages (Realtime)
  useEffect(() => {
    if (!roomId) return;

    fetchHumanMessages();
    fetchAIHistory();

    // Subscribe to new messages table inserts for this room
    const channel = supabase
      .channel(`room_messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          const username = await getUserProfile(payload.new.user_id);
          const newMessage = {
            id: payload.new.id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            user_id: payload.new.user_id,
            username: username
          };
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchHumanMessages, fetchAIHistory]);

  // 4. Send a Human Message
  const sendHumanMessage = useCallback(async (content) => {
    if (!roomId || !content.trim()) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active user session');

      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          user_id: session.user.id,
          content: content.trim()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send human message:', error);
      throw error;
    }
  }, [roomId]);

  // 5. Ask AI (Streaming SSE response)
  const askAI = useCallback(async (question) => {
    if (!roomId || !question.trim()) return;

    setAiLoading(true);
    setAiStreamingText('');
    
    // Add temporary user message to AI Chat local list instantly
    const userMsgTemp = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: question,
      created_at: new Date().toISOString()
    };
    setAiMessages((prev) => [...prev, userMsgTemp]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active user session');

      const token = session.access_token;
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms/${roomId}/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'AI request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkStr = decoder.decode(value);
          // Split by SSE double newline delimiters
          const lines = chunkStr.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setAiStreamingText(accumulatedText);
                }
              } catch (e) {
                // Ignore parsing errors for partial packet fragments
              }
            }
          }
        }
      }

      // Once done, append the actual messages to history list
      // Refresh AI message logs from database to ensure we get exact rows with UUIDs
      await fetchAIHistory();
      setAiStreamingText('');
    } catch (error) {
      console.error('Error during AI chat stream:', error);
      
      // Append an error message from assistant
      const errorMsgTemp = {
        id: `temp-error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message || 'Something went wrong while connecting to the assistant.'}`,
        created_at: new Date().toISOString()
      };
      setAiMessages((prev) => [...prev, errorMsgTemp]);
    } finally {
      setAiLoading(false);
      setAiStreamingText('');
    }
  }, [roomId, fetchAIHistory]);

  return {
    messages,
    humanLoading,
    sendHumanMessage,
    aiMessages,
    aiLoading,
    aiStreamingText,
    askAI
  };
}
