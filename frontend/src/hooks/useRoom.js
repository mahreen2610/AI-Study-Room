import { useState, useCallback } from 'react';
import api from '../lib/api';

/**
 * Custom hook to interact with study rooms.
 */
export default function useRoom() {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRooms = useCallback(async () => {
    console.log('[useRoom] Starting fetchRooms call...');
    setLoading(true);
    setError(null);
    try {
      console.log('[useRoom] Sending GET /rooms request via api...');
      const res = await api.get('/rooms');
      console.log('[useRoom] Rooms fetched successfully:', res.data.length, 'rooms found');
      setRooms(res.data);
      return res.data;
    } catch (err) {
      console.error('[useRoom] Error fetching rooms:', err);
      const errMsg = err.response?.data?.error || err.message;
      setError(errMsg);
      throw err;
    } finally {
      console.log('[useRoom] fetchRooms process complete, setting loading=false');
      setLoading(false);
    }
  }, []);

  const fetchRoomDetails = useCallback(async (roomId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/rooms/${roomId}`);
      setCurrentRoom(res.data);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRoom = useCallback(async (name, description) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/rooms', { name, description });
      setRooms((prev) => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (inviteCode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/rooms/join', { inviteCode });
      setRooms((prev) => {
        if (prev.some((r) => r.id === res.data.id)) return prev;
        return [res.data, ...prev];
      });
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    rooms,
    currentRoom,
    loading,
    error,
    fetchRooms,
    fetchRoomDetails,
    createRoom,
    joinRoom
  };
}
