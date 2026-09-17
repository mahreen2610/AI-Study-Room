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
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

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

  // 1. Hook to load profile whenever the user state changes
  useEffect(() => {
    let isMounted = true;

    async function loadProfileForUser() {
      if (user) {
        // Skip duplicate profile fetch if it is already loaded and matches current user
        if (profile && profile.id === user.id) {
          if (isMounted && !isInitializing) setLoading(false);
          return;
        }

        console.log(`[AuthContext] loadProfileForUser: fetching profile for user ID: ${user.id}...`);
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (isMounted) {
            if (error) {
              console.error('[AuthContext] loadProfileForUser database error:', error);
            } else {
              setProfile(data);
            }
          }
        } catch (err) {
          console.error('[AuthContext] loadProfileForUser exception:', err);
        } finally {
          if (isMounted && !isInitializing) setLoading(false);
        }
      } else {
        setProfile(null);
        if (isMounted && !isInitializing) setLoading(false);
      }
    }

    loadProfileForUser();

    return () => {
      isMounted = false;
    };
  }, [user, isInitializing]);

  // 2. Initial session load and auth subscription
  useEffect(() => {
    let isMounted = true;

    console.log('[AuthContext] Init: checking current session...');
    
    // Get initial session synchronously from supabase client cache if ready
    const initialSession = getActiveSession();
    if (initialSession) {
      console.log('[AuthContext] Found initial session from activeSession cache');
      setUser(initialSession.user);
    } else {
      console.log('[AuthContext] No initial session found in cache, will await subscription event');
    }

    // Subscribe to auth state changes to keep states in sync
    console.log('[AuthContext] Init: subscribing to onAuthStateChange...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      console.log(`[AuthContext] onAuthStateChange event fired: "${event}", session present: ${!!session}`);
      
      const currentUser = session ? session.user : null;
      setUser(currentUser);
      setIsInitializing(false); // First event fired, initialization is complete!
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
      
      // Update state immediately to avoid routing race conditions
      setUser(data.user);
      await fetchProfile(data.user.id);
      
      return data;
    } catch (err) {
      setLoading(false);
      throw err;
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
    loading: isInitializing || loading, // Combine initialization and profile load state
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
