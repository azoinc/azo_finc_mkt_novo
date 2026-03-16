// Test script to verify environment variables
console.log('=== Environment Variables Test ===');
console.log('VITE_SUPABASE_URL:', import.meta.env?.VITE_SUPABASE_URL ? 'configured' : 'missing');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env?.VITE_SUPABASE_ANON_KEY ? 'configured' : 'missing');
console.log('NODE_ENV:', typeof window !== 'undefined' ? 'browser' : 'server');
console.log('Available env vars:', Object.keys(import.meta.env || {}).filter(key => key.startsWith('VITE_')));
