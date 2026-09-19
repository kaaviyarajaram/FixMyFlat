import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://swlhqczzwocvibjjokdn.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_iibzqy67mryUjKGYEkgrwQ_V88WXkAz';


const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL
).trim();

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  DEFAULT_SUPABASE_ANON_KEY
).trim();

// Verify if valid Supabase configuration is present
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

if (!isSupabaseConfigured) {
  console.error(
    '[Supabase Configuration Error] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or invalid! ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel Project Settings -> Environment Variables or local .env file.'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

