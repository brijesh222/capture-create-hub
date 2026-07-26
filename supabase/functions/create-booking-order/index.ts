// Creates a Razorpay order and a pending booking, server-side.
//
// Why this exists rather than calling Razorpay from the browser:
//
//  1. The Razorpay key secret would be readable by anyone if it shipped in the
//     bundle, letting them create and confirm orders as the studio.
//
//  2. The amount must never come from the client. If the browser said what to
//     charge, a customer could book a ₹1,40,000 wedding for ₹1 by editing one
//     number. The price is looked up here, from the studio's own saved config.
//
// Deploy: Supabase dashboard → Edge Functions → new function → paste this.
// Secrets required (Edge Functions → Secrets):
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

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

/** "₹15,000" -> 15000 */
function parsePrice(price: string): number {
  const digits = (price || "").replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

interface Payload {
  serviceSlug: string;
  packageRef: string;
  day: string; // YYYY-MM-DD
  slotId: string;
  payMode: "advance" | "full";
  name: string;
  phone: string;
  email?: string;
  location: string;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) {
    return json({ error: "Payments are not configured." }, 500);
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  // Service role: this function is trusted, unlike the browser.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ---- price and slot come from the studio's config, never the client ----
  const { data: configRow, error: configError } = await supabase
    .from("site_config")
    .select("config")
    .eq("id", 1)
    .maybeSingle();

  if (configError || !configRow?.config) {
    return json({ error: "Couldn't load pricing." }, 500);
  }

  const config = configRow.config as Record<string, any>;
  const pack = (config.packages?.items ?? []).find(
    (p: { id: string }) => p.id === body.packageRef
  );
  if (!pack) return json({ error: "That package no longer exists." }, 400);

  const slot = (config.booking?.slots ?? []).find(
    (s: { id: string }) => s.id === body.slotId
  );
  if (!slot) return json({ error: "That time slot no longer exists." }, 400);

  const advancePercent = Number(config.booking?.advancePercent ?? 10);
  const totalPaise = parsePrice(pack.price) * 100;
  const amountPaise =
    body.payMode === "full"
      ? totalPaise
      : Math.round((totalPaise * advancePercent) / 100);

  if (amountPaise < 100) {
    return json({ error: "That amount is too small to charge." }, 400);
  }

  // ---- create the booking first, so the slot is taken before we charge ----
  // If this fails on the overlap constraint, somebody else got the slot and we
  // must not take the customer's money.
  const startsAt = new Date(`${body.day}T${slot.start}:00+05:30`);
  const endsAt = new Date(`${body.day}T${slot.end}:00+05:30`);

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "awaiting_payment",
      // Released automatically if payment never completes.
      hold_expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      total_paise: totalPaise,
      advance_paise: amountPaise,
      pay_mode: body.payMode,
      contact_name: body.name,
      contact_phone: body.phone,
      contact_email: body.email || null,
      location_note: body.location,
      customer_notes: body.notes ?? "",
      slot_id: body.slotId,
      service_slug: body.serviceSlug,
      package_ref: body.packageRef,
    })
    .select("id")
    .single();

  if (bookingError) {
    // 23P01 = exclusion violation: the slot overlaps a live booking.
    if (bookingError.code === "23P01") {
      return json(
        { error: "taken", message: "That slot was just booked. Please pick another." },
        409
      );
    }
    return json({ error: "Couldn't create the booking." }, 500);
  }

  // ---- ask Razorpay for an order ----
  const auth = btoa(`${keyId}:${keySecret}`);
  const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: booking.id,
      notes: { booking_id: booking.id, package: pack.name },
    }),
  });

  if (!rzpResponse.ok) {
    // Free the slot again rather than leaving it blocked by a dead booking.
    await supabase.from("bookings").update({ status: "failed" }).eq("id", booking.id);
    return json({ error: "Couldn't start the payment. Please try again." }, 502);
  }

  const order = await rzpResponse.json();

  await supabase.from("payments").insert({
    booking_id: booking.id,
    kind: body.payMode === "full" ? "balance" : "advance",
    amount_paise: amountPaise,
    status: "created",
    razorpay_order_id: order.id,
  });

  return json({
    orderId: order.id,
    amountPaise,
    currency: "INR",
    keyId,
    bookingId: booking.id,
  });
});
