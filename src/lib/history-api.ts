import { getSupabase } from "./supabase";
import type { SiteConfig } from "@/types/site-config";

export interface ConfigVersion {
  id: string;
  config: SiteConfig;
  savedByEmail: string;
  note: string;
  createdAt: string;
}

/** Recent saved versions of the site config. Super-admin only (via RLS). */
export async function fetchConfigHistory(): Promise<ConfigVersion[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("config_history")
    .select("id,config,saved_by_email,note,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    config: r.config as SiteConfig,
    savedByEmail: r.saved_by_email ?? "",
    note: r.note ?? "",
    createdAt: r.created_at,
  }));
}
