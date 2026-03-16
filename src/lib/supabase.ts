import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gmvmdryoisurvhtdrppb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtdm1kcnlvaXN1cnZodGRycHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMDAwMDAsImV4cCI6MjA0OTU3NjAwMH0';

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
