import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getActiveSession } from '../lib/supabaseClient';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch user profiles
  async function fetchProfile(userId) {
    console.log(`[AuthContext] fetchProfile: loading database profile for user ID: ${userId}...`);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[AuthContext] fetchProfile database error:', error);
      } else {
        console.log('[AuthContext] fetchProfile success, found profile:', data);
        setProfile(data);
      }
    } catch (err) {
      console.error('[AuthContext] fetchProfile caught exception:', err);
    } finally {
      console.log('[AuthContext] fetchProfile finished, setting loading=false');
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    console.log('[AuthContext] Init: checking current session...');
    
    // 1. Get initial session synchronously from supabase client cache if ready
    const initialSession = getActiveSession();
    if (initialSession) {
      console.log('[AuthContext] Found initial session from activeSession cache');
      setUser(initialSession.user);
      fetchProfile(initialSession.user.id);
    } else {
      console.log('[AuthContext] No initial session found in cache, will await subscription event');
    }

    // 2. Subscribe to auth state changes to keep states in sync
    console.log('[AuthContext] Init: subscribing to onAuthStateChange...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      console.log(`[AuthContext] onAuthStateChange event fired: "${event}", session present: ${!!session}`);
      
      setUser((prevUser) => {
        const newUserId = session?.user?.id || null;
        const prevUserId = prevUser?.id || null;
        
        if (newUserId !== prevUserId) {
          console.log(`[AuthContext] User change detected: ${prevUserId} -> ${newUserId}`);
          if (session) {
            fetchProfile(session.user.id);
          } else {
            console.log('[AuthContext] No session, clearing profile and setting loading=false');
            setProfile(null);
            setLoading(false);
          }
        } else {
          console.log('[AuthContext] User ID unchanged. Skipping duplicate profile fetch');
          // If we had no session and user ID is still null, make sure loading is false
          if (!session) {
            setLoading(false);
          }
        }
        return session ? session.user : null;
      });
    });

    return () => {
      isMounted = false;
      console.log('[AuthContext] Cleanup: unsubscribing from session changes...');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, username) => {
    console.log('[AuthContext] signUp requested for email:', email);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });
      if (error) {
        console.error('[AuthContext] signUp error:', error.message);
        throw error;
      }
      console.log('[AuthContext] signUp success');
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    console.log('[AuthContext] signIn requested for email:', email);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        console.error('[AuthContext] signIn error:', error.message);
        throw error;
      }
      console.log('[AuthContext] signIn success');
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('[AuthContext] signOut requested');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthContext] signOut error:', error.message);
        throw error;
      }
      console.log('[AuthContext] signOut success');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
