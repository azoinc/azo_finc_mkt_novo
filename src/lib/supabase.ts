import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log environment variables (only in development)
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl ? 'configured' : 'missing');
  console.log('Supabase Key:', supabaseAnonKey ? 'configured' : 'missing');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
