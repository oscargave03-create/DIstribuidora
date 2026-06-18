import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  !!supabaseAnonKey &&
  supabaseAnonKey !== 'placeholder-anon-key';

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase URL or Anon Key is missing in environment variables. ' +
    'Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your settings / .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
