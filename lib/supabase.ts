import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('🔍 Supabase Config Check:');
console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please create .env.local file with:');
  console.error('VITE_SUPABASE_URL=your-url');
  console.error('VITE_SUPABASE_ANON_KEY=your-key');
  console.error('Then restart your dev server with: npm run dev');
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  console.error('❌ Invalid Supabase URL format! Should start with https://');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
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
  console.warn('⚠️ Supabase client initialized with placeholder values');
}

