import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('🔍 Supabase Config Check:');
console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = '❌ Missing Supabase environment variables!\n\n' +
    'For local development:\n' +
    '  - Create .env.local file with:\n' +
    '    VITE_SUPABASE_URL=your-url\n' +
    '    VITE_SUPABASE_ANON_KEY=your-key\n' +
    '  - Restart dev server: npm run dev\n\n' +
    'For production (Vercel):\n' +
    '  - Go to Vercel Dashboard → Project Settings → Environment Variables\n' +
    '  - Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY\n' +
    '  - Redeploy your application';
  console.error(errorMsg);
  
  // In production, throw error to fail fast
  if (import.meta.env.PROD) {
    throw new Error('Supabase configuration is missing. Please check environment variables in your deployment settings.');
  }
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  console.error('❌ Invalid Supabase URL format! Should start with https://');
}

// Use fallback values only in development, throw in production
const finalUrl = supabaseUrl || (import.meta.env.PROD ? '' : 'https://placeholder.supabase.co');
const finalKey = supabaseAnonKey || (import.meta.env.PROD ? '' : 'placeholder-key');

export const supabase = createClient(
  finalUrl,
  finalKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);

// Log for debugging
if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase client initialized');
  console.log('URL:', supabaseUrl);
} else {
  console.warn('⚠️ Supabase client initialized with placeholder values (development only)');
}

