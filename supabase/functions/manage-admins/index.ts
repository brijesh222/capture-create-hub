// Admin-user management, callable only by an existing SUPER admin.
//
// Creating login accounts, roles and passwords need the service-role key, which
// must never ship to the browser. The browser calls this; it verifies the
// caller is a super admin, then acts server-side.
//
// Deploy with "Verify JWT" ON.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const CAPS = ["content", "services", "settings", "bookings", "invoices", "reviews"];
const cleanPerms = (p: unknown): string[] =>
  Array.isArray(p) ? p.filter((x) => typeof x === "string" && CAPS.includes(x)) : [];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ ok: false, error: "You're not signed in." });

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) return json({ ok: false, error: "Your session has expired." });
  const caller = userData.user;

  const { data: callerRow } = await admin
    .from("admin_users")
    .select("role")
    .eq("user_id", caller.id)
    .maybeSingle();
  if (!callerRow) return json({ ok: false, error: "Only admins can manage access." });
  if (callerRow.role !== "super") return json({ ok: false, error: "Only a super admin can manage access." });

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Bad request." });
  }
  const action = body.action as string;
  const userId = body.userId as string | undefined;
  const password = (body.password as string) || "";

  const superCount = async () => {
    const { count } = await admin
      .from("admin_users")
      .select("*", { count: "exact", head: true })
      .eq("role", "super");
    return count ?? 0;
  };

  // ---- list ----
  if (action === "list") {
    const { data } = await admin
      .from("admin_users")
      .select("user_id,email,role,permissions,created_at")
      .order("created_at", { ascending: true });
    return json({ ok: true, admins: data ?? [], me: caller.id });
  }

  // ---- create a new admin ----
  if (action === "create") {
    const email = ((body.email as string) || "").trim().toLowerCase();
    const role = body.role === "super" ? "super" : "admin";
    const permissions = role === "super" ? [] : cleanPerms(body.permissions);
    if (!email || !email.includes("@")) return json({ ok: false, error: "Enter a valid email." });
    if (password.length < 8) return json({ ok: false, error: "Password must be at least 8 characters." });

    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (cErr || !created.user) {
      return json({ ok: false, error: cErr?.message || "Couldn't create that account (email may already exist)." });
    }
    const { error: insErr } = await admin
      .from("admin_users")
      .insert({ user_id: created.user.id, email, role, permissions });
    if (insErr) {
      await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
      return json({ ok: false, error: insErr.message });
    }
    return json({ ok: true });
  }

  // ---- remove an admin ----
  if (action === "remove") {
    if (!userId) return json({ ok: false, error: "Missing user." });
    if (userId === caller.id) return json({ ok: false, error: "You can't remove yourself." });

    const { data: target } = await admin
      .from("admin_users")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (target?.role === "super" && (await superCount()) <= 1) {
      return json({ ok: false, error: "Can't remove the last super admin." });
    }
    await admin.from("admin_users").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return json({ ok: true });
  }

  // ---- reset an admin's password ----
  if (action === "resetPassword") {
    if (!userId) return json({ ok: false, error: "Missing user." });
    if (password.length < 8) return json({ ok: false, error: "Password must be at least 8 characters." });
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return json({ ok: false, error: error.message });
    return json({ ok: true });
  }

  // ---- set an admin's capabilities ----
  if (action === "setPermissions") {
    if (!userId) return json({ ok: false, error: "Missing user." });
    const permissions = cleanPerms(body.permissions);
    const { error } = await admin.from("admin_users").update({ permissions }).eq("user_id", userId);
    if (error) return json({ ok: false, error: error.message });
    return json({ ok: true });
  }

  // ---- promote / demote ----
  if (action === "setRole") {
    if (!userId) return json({ ok: false, error: "Missing user." });
    const role = body.role === "super" ? "super" : "admin";
    if (role === "admin") {
      const { data: target } = await admin
        .from("admin_users")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (target?.role === "super" && (await superCount()) <= 1) {
        return json({ ok: false, error: "Can't demote the last super admin." });
      }
    }
    // Promoting to super clears the per-capability list (supers have everything).
    const patch = role === "super" ? { role, permissions: [] } : { role };
    const { error } = await admin.from("admin_users").update(patch).eq("user_id", userId);
    if (error) return json({ ok: false, error: error.message });
    return json({ ok: true });
  }

  return json({ ok: false, error: "Unknown action." });
});
