import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { SiteConfig } from "@/types/site-config";
import { mergeWithDefaults, saveSiteConfig } from "@/data/default-config";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const CONFIG_ROW_ID = 1;

let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseInstance;
}

/**
 * Fetch config from cloud (Supabase). Returns null if not configured or fetch fails.
 */
export async function fetchConfigFromCloud(): Promise<SiteConfig | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("site_config")
      .select("config")
      .eq("id", CONFIG_ROW_ID)
      .maybeSingle();
    if (error || !data?.config) return null;
    const parsed = typeof data.config === "string" ? JSON.parse(data.config) : data.config;
    return mergeWithDefaults(parsed);
  } catch {
    return null;
  }
}

/**
 * Save config to cloud (Supabase). Saves to localStorage too.
 * Returns true if cloud save succeeded (or not configured), false on error.
 */
export async function saveConfigToCloud(config: SiteConfig): Promise<{ ok: boolean; message: string }> {
  saveSiteConfig(config); // always save locally
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: true, message: "Saved locally. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to sync for all users." };
  }
  try {
    const { error } = await supabase
      .from("site_config")
      .upsert(
        { id: CONFIG_ROW_ID, config: config, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: "Saved! Changes will appear for all users." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Failed to save to cloud." };
  }
}

export function isCloudConfigEnabled(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}
