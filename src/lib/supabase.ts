import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

/**
 * Single shared client. Returns null when the project isn't configured, so
 * every caller has to handle the "no backend" case — the site still runs on
 * local storage without it.
 *
 * The key here is the publishable/anon key, which is public by design: it ends
 * up in the JS bundle either way. Access is controlled by row level security,
 * not by hiding it. The service/secret key must never appear in this codebase.
 */
export function getSupabase(): SupabaseClient | null {
  if (!URL || !KEY) return null;
  if (!client) {
    client = createClient(URL, KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(URL && KEY);
}
