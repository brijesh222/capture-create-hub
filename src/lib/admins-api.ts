import { getSupabase } from "./supabase";
import { makeAccess, type Cap, type MyAccess } from "./admin-perms";

export interface AdminUser {
  user_id: string;
  email: string;
  role: "super" | "admin";
  permissions: Cap[];
  created_at: string;
}

async function callManageAdmins(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Not connected to the database." };
  const { data, error } = await supabase.functions.invoke("manage-admins", { body });
  if (error) {
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

/** The signed-in admin's own role and capabilities (read via self-RLS). */
export async function fetchMyAccess(): Promise<MyAccess> {
  const supabase = getSupabase();
  if (!supabase) return makeAccess(null, []);
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData.session?.user.id;
  if (!uid) return makeAccess(null, []);
  const { data } = await supabase
    .from("admin_users")
    .select("role,permissions")
    .eq("user_id", uid)
    .maybeSingle();
  if (!data) return makeAccess(null, []);
  return makeAccess(
    data.role === "super" ? "super" : "admin",
    (data.permissions as Cap[]) ?? []
  );
}

export async function listAdmins(): Promise<{ admins: AdminUser[]; me: string } | { error: string }> {
  const res = await callManageAdmins({ action: "list" });
  if (res.ok) return { admins: (res.admins as AdminUser[]) ?? [], me: (res.me as string) ?? "" };
  return { error: (res.error as string) ?? "Couldn't load admins." };
}

export async function addAdmin(
  email: string,
  password: string,
  role: "super" | "admin",
  permissions: Cap[]
): Promise<{ ok: true } | { error: string }> {
  const res = await callManageAdmins({ action: "create", email, password, role, permissions });
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

export async function setAdminPermissions(
  userId: string,
  permissions: Cap[]
): Promise<{ ok: true } | { error: string }> {
  const res = await callManageAdmins({ action: "setPermissions", userId, permissions });
  return res.ok ? { ok: true } : { error: (res.error as string) ?? "Couldn't save permissions." };
}

export async function setAdminRole(
  userId: string,
  role: "super" | "admin"
): Promise<{ ok: true } | { error: string }> {
  const res = await callManageAdmins({ action: "setRole", userId, role });
  return res.ok ? { ok: true } : { error: (res.error as string) ?? "Couldn't change role." };
}

/** Change the signed-in admin's own password (no elevated function needed). */
export async function changeMyPassword(password: string): Promise<{ ok: true } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Not connected to the database." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { ok: true };
}
