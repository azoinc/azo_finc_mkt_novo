// Test environment variables in browser console
// Copy and paste this in the browser console on your deployed site

console.log('=== Environment Variables Test ===');
console.log('VITE_SUPABASE_URL:', import.meta.env?.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env?.VITE_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing');

// Test if variables are actually accessible
try {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (url && key) {
    console.log('✅ Both variables are accessible');
    console.log('URL starts with:', url.substring(0, 20) + '...');
    console.log('Key starts with:', key.substring(0, 20) + '...');
  } else {
    console.log('❌ Variables are not accessible');
    console.log('Available env vars:', Object.keys(import.meta.env || {}));
  }
} catch (error) {
  console.error('❌ Error accessing environment variables:', error);
}

// Test if we can create Supabase client
try {
  const { createClient } = window.supabase || {};
  if (createClient) {
    console.log('✅ Supabase client available');
  } else {
    console.log('❌ Supabase client not available');
  }
} catch (error) {
  console.error('❌ Error checking Supabase client:', error);
}
