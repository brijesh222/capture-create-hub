import type { Session } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabase";

/**
 * Admin authentication, backed by Supabase Auth.
 *
 * This replaces the previous version, which checked only that the visitor typed
 * a known email address — no password — and recorded the result in
 * sessionStorage. That email shipped in the public bundle, and the flag could be
 * set from the browser console, so the admin panel was open to anyone who
 * looked.
 *
 * Sessions are now issued and validated by Supabase, and the database's row
 * level security policies enforce the same boundary server-side. Faking a
 * session in the browser no longer grants any write access.
 */

export async function signIn(
  email: string,
  password: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase isn't configured. Add the project URL and key to .env.local.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    // One message for both unknown email and wrong password: saying which was
    // wrong lets an attacker discover valid accounts.
    return { ok: false, message: "That email and password don't match." };
  }
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await getSupabase()?.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Fires on sign in, sign out, and token refresh. */
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const supabase = getSupabase();
  if (!supabase) {
    cb(null);
    return () => {};
  }
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export { isSupabaseConfigured };
