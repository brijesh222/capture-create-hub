// Admin-user management, callable only by an existing admin.
//
// Creating login accounts and resetting passwords needs the service-role key,
// which must never ship to the browser. So the browser calls this function; it
// verifies the caller is a listed admin, then performs the action server-side.
//
// Deploy with "Verify JWT" ON. Secrets are the auto-provided SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ---- authenticate the caller and confirm they're an admin ----
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ ok: false, error: "You're not signed in." });

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) return json({ ok: false, error: "Your session has expired." });
  const caller = userData.user;

  const { data: adminRow } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", caller.id)
    .maybeSingle();
  if (!adminRow) return json({ ok: false, error: "Only admins can manage access." });

  let body: Record<string, string> = {};
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Bad request." });
  }
  const action = body.action;

  // ---- list ----
  if (action === "list") {
    const { data } = await admin
      .from("admin_users")
      .select("user_id,email,created_at")
      .order("created_at", { ascending: true });
    return json({ ok: true, admins: data ?? [], me: caller.id });
  }

  // ---- create a new admin ----
  if (action === "create") {
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
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
      .insert({ user_id: created.user.id, email });
    if (insErr) {
      // Roll back the auth user so a half-created admin doesn't linger.
      await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
      return json({ ok: false, error: insErr.message });
    }
    return json({ ok: true });
  }

  // ---- remove an admin ----
  if (action === "remove") {
    const userId = body.userId;
    if (!userId) return json({ ok: false, error: "Missing user." });
    if (userId === caller.id) return json({ ok: false, error: "You can't remove yourself." });

    const { count } = await admin
      .from("admin_users")
      .select("*", { count: "exact", head: true });
    if ((count ?? 0) <= 1) return json({ ok: false, error: "Can't remove the last admin." });

    await admin.from("admin_users").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return json({ ok: true });
  }

  // ---- reset another admin's password ----
  if (action === "resetPassword") {
    const userId = body.userId;
    const password = body.password || "";
    if (!userId) return json({ ok: false, error: "Missing user." });
    if (password.length < 8) return json({ ok: false, error: "Password must be at least 8 characters." });

    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return json({ ok: false, error: error.message });
    return json({ ok: true });
  }

  return json({ ok: false, error: "Unknown action." });
});
