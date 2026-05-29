import axios from 'axios';
import { getActiveSession } from './supabaseClient';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`
});

// Axios interceptor to dynamically inject Supabase JWT access token synchronously
api.interceptors.request.use(
  (config) => {
    console.log('[Axios Interceptor] Checking session...');
    const session = getActiveSession();
    if (session && session.access_token) {
      console.log('[Axios Interceptor] Token found, injecting bearer header');
      config.headers.Authorization = `Bearer ${session.access_token}`;
    } else {
      console.warn('[Axios Interceptor] No active session or token found');
    }
    console.log(`[Axios Interceptor] Sending request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('[Axios Interceptor] Request error:', error);
    return Promise.reject(error);
  }
);

export default api;

