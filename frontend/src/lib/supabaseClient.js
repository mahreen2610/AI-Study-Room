import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from frontend environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Track session state synchronously to avoid race conditions and database query blocks
let activeSession = null;

// Subscribe immediately to keep activeSession in sync
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`[SupabaseClient] Auth event: ${event}, session present:`, !!session);
  activeSession = session;
});

export const getActiveSession = () => activeSession;

