import { getSupabase } from "./supabase";

export interface AdminUser {
  user_id: string;
  email: string;
  created_at: string;
}

/**
 * Call the admin-only edge function. The user's session token is attached
 * automatically, and the function verifies the caller is a listed admin before
 * doing anything. Returns the parsed body (which carries { ok, error }).
 */
async function callManageAdmins(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Not connected to the database." };
  const { data, error } = await supabase.functions.invoke("manage-admins", { body });
  if (error) {
    // Try to surface the function's own error message from the response body.
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") {
        const parsed = await ctx.json();
        if (parsed?.error) return { ok: false, error: parsed.error };
      }
    } catch {
      /* ignore */
    }
    return { ok: false, error: error.message || "Request failed." };
  }
  return (data as Record<string, unknown>) ?? { ok: false, error: "No response." };
}

export async function listAdmins(): Promise<{ admins: AdminUser[]; me: string } | { error: string }> {
  const res = await callManageAdmins({ action: "list" });
  if (res.ok) return { admins: (res.admins as AdminUser[]) ?? [], me: (res.me as string) ?? "" };
  return { error: (res.error as string) ?? "Couldn't load admins." };
}

export async function addAdmin(email: string, password: string): Promise<{ ok: true } | { error: string }> {
  const res = await callManageAdmins({ action: "create", email, password });
  return res.ok ? { ok: true } : { error: (res.error as string) ?? "Couldn't add admin." };
}

export async function removeAdmin(userId: string): Promise<{ ok: true } | { error: string }> {
  const res = await callManageAdmins({ action: "remove", userId });
  return res.ok ? { ok: true } : { error: (res.error as string) ?? "Couldn't remove admin." };
}

export async function resetAdminPassword(
  userId: string,
  password: string
): Promise<{ ok: true } | { error: string }> {
  const res = await callManageAdmins({ action: "resetPassword", userId, password });
  return res.ok ? { ok: true } : { error: (res.error as string) ?? "Couldn't reset password." };
}

/** Change the signed-in admin's own password (no elevated function needed). */
export async function changeMyPassword(password: string): Promise<{ ok: true } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Not connected to the database." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { ok: true };
}
