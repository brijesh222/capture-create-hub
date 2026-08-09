import type { SiteConfig } from "@/types/site-config";
import { mergeWithDefaults, saveSiteConfig } from "@/data/default-config";
import { getSupabase, isSupabaseConfigured } from "./supabase";

const CONFIG_ROW_ID = 1;

/**
 * Fetch config from Supabase. Returns null when it isn't configured, the row is
 * empty, or the request fails — callers fall back to local storage so the site
 * always renders.
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

    const parsed =
      typeof data.config === "string" ? JSON.parse(data.config) : data.config;

    // A brand new project has an empty {} row. Treat that as "nothing saved
    // yet" rather than wiping the site back to a blank config.
    if (!parsed || Object.keys(parsed).length === 0) return null;

    return mergeWithDefaults(parsed);
  } catch {
    return null;
  }
}

/**
 * Save config. Always writes locally first so the admin never loses work, then
 * tries the cloud.
 *
 * The database only accepts writes from a signed-in admin, so an expired
 * session surfaces here as a clear message rather than a silent no-op.
 */
export async function saveConfigToCloud(
  config: SiteConfig
): Promise<{ ok: boolean; message: string }> {
  saveSiteConfig(config);

  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: true,
      message: "Saved to this browser. Connect Supabase to sync for all visitors.",
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return {
      ok: false,
      message: "Your session expired. Sign in again to save for all visitors.",
    };
  }

  try {
    const { data, error } = await supabase
      .from("site_config")
      .update({ config, updated_at: new Date().toISOString() })
      .eq("id", CONFIG_ROW_ID)
      .select("id");

    if (error) return { ok: false, message: error.message };

    // Row level security makes a rejected write look like a successful update
    // of zero rows. Without this check, a failed save would report success.
    if (!data || data.length === 0) {
      return { ok: false, message: "Save was rejected. Sign in again and retry." };
    }

    // Snapshot this version for the super admin's history/undo. Best-effort:
    // a failed snapshot must not fail the save.
    try {
      await supabase.from("config_history").insert({
        config,
        saved_by: sessionData.session.user.id,
        saved_by_email: sessionData.session.user.email ?? "",
        note: "",
      });
    } catch {
      /* ignore */
    }

    return { ok: true, message: "Saved. Changes are live for all visitors." };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Couldn't reach the database.",
    };
  }
}

export function isCloudConfigEnabled(): boolean {
  return isSupabaseConfigured();
}
