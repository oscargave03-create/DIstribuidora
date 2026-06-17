// Firebase integration is removed per user request to transition to Supabase.
// This mock file ensures existing imports don't break during compilation.
// We proxy isConfigured to check if Supabase is set up.

export const app = null as any;
export const db = null as any;
export const auth = null as any;

export const isConfigured = !!(
  (import.meta as any).env?.VITE_SUPABASE_URL && 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY &&
  !(import.meta as any).env?.VITE_SUPABASE_URL.includes("placeholder")
);
