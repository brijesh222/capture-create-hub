// Adds a confirmed booking to Google Calendar.
//
// Authenticates as a Google service account (server-to-server), so no human
// login or token refresh is needed. The service account can only touch a
// calendar that has been explicitly shared with its client_email — that
// sharing step is what grants access.
//
// Called from two places, both with a valid Supabase JWT:
//   - the Razorpay webhook, after an online payment confirms a booking
//   - the admin app, after cash is marked received
//
// Secrets: GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_CALENDAR_ID
//
// Deploy with "Verify JWT" ON.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

/** PEM private key → CryptoKey for RS256 signing. */
async function importKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** Exchange a service-account JWT for a short-lived access token. */
async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claim = b64url(
    new TextEncoder().encode(
      JSON.stringify({
        iss: clientEmail,
        scope: "https://www.googleapis.com/auth/calendar.events",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    )
  );
  const signingInput = `${header}.${claim}`;
  const key = await importKey(privateKey);
  const sig = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput))
  );
  const jwt = `${signingInput}.${b64url(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`token: ${JSON.stringify(data)}`);
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID");
  if (!raw || !calendarId) return json({ error: "Calendar not configured" }, 500);

  let bookingId: string;
  try {
    bookingId = (await req.json()).bookingId;
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  if (!bookingId) return json({ error: "Missing bookingId" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: b } = await supabase
    .from("bookings")
    .select(
      "starts_at,ends_at,service_slug,contact_name,contact_phone,location_note,total_paise,advance_paise,pay_mode,payment_method"
    )
    .eq("id", bookingId)
    .single();

  if (!b) return json({ error: "Booking not found" }, 404);

  let creds: { client_email: string; private_key: string };
  try {
    creds = JSON.parse(raw);
  } catch {
    return json({ error: "Bad service account JSON" }, 500);
  }

  let token: string;
  try {
    token = await getAccessToken(creds.client_email, creds.private_key);
  } catch (e) {
    return json({ error: `auth failed: ${e instanceof Error ? e.message : e}` }, 502);
  }

  const paidNote =
    b.payment_method === "cash" ? "Cash" : b.pay_mode === "full" ? "Paid in full" : "Advance paid";

  const event = {
    summary: `${b.service_slug} — ${b.contact_name}`,
    description: [
      `Customer: ${b.contact_name}`,
      `Phone: ${b.contact_phone}`,
      b.location_note ? `Location: ${b.location_note}` : "",
      `Payment: ${paidNote} (${b.payment_method})`,
    ]
      .filter(Boolean)
      .join("\n"),
    location: b.location_note || undefined,
    start: { dateTime: b.starts_at, timeZone: "Asia/Kolkata" },
    end: { dateTime: b.ends_at, timeZone: "Asia/Kolkata" },
  };

  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }
  );

  if (!calRes.ok) {
    const detail = await calRes.text();
    // 403/404 here almost always means the calendar isn't shared with the
    // service account, or the calendar id is wrong.
    return json({ error: "calendar rejected", status: calRes.status, detail }, 502);
  }

  const created = await calRes.json();
  return json({ ok: true, eventId: created.id });
});
