// Confirms bookings when Razorpay says the money arrived, and notifies both
// sides.
//
// Why the webhook and not the browser: customers close the tab after paying,
// lose signal, or get bounced into a UPI app that never returns. If the booking
// were confirmed by the page they land back on, those payments would be taken
// with no booking to show for them. Razorpay's server tells us instead, whether
// or not the customer ever comes back.
//
// Deploy with "Verify JWT" OFF — Razorpay's servers have no Supabase token.
// The signature check below is what authenticates the call.
//
// Secrets: RAZORPAY_WEBHOOK_SECRET, RESEND_API_KEY, NOTIFY_EMAIL, FROM_EMAIL

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Constant-time compare, so a timing attack can't reveal the signature. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const rupees = (paise: number) =>
  `₹${new Intl.NumberFormat("en-IN").format(Math.round(paise / 100))}`;

const onDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/**
 * Sends one email via Resend. Never throws: a failed notification must not
 * fail the webhook, or Razorpay would retry and we'd risk double-processing a
 * payment that already succeeded.
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("FROM_EMAIL");
  if (!apiKey || !from || !to) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function studioEmail(b: Record<string, any>, paidPaise: number): string {
  const balance = b.total_paise - b.advance_paise;
  return `
    <h2 style="font-weight:400">New booking confirmed</h2>
    <p><strong>${b.contact_name}</strong> has paid and locked in a date.</p>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:4px 16px 4px 0;color:#666">Date</td><td>${onDate(b.starts_at)}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#666">Service</td><td>${b.service_slug}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#666">Phone</td><td><a href="tel:${b.contact_phone}">${b.contact_phone}</a></td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#666">Email</td><td>${b.contact_email ?? "—"}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#666">Location</td><td>${b.location_note || "—"}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#666">Paid now</td><td>${rupees(paidPaise)}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#666">Balance due</td><td>${b.pay_mode === "full" ? "Nothing" : rupees(balance)}</td></tr>
    </table>
    ${b.customer_notes ? `<p style="color:#666"><em>"${b.customer_notes}"</em></p>` : ""}
    <p style="margin-top:20px">
      <a href="https://wa.me/${String(b.contact_phone).replace(/\D/g, "")}"
         style="background:#235143;color:#fff;padding:10px 18px;border-radius:99px;text-decoration:none">
        Message them on WhatsApp
      </a>
    </p>`;
}

function customerEmail(b: Record<string, any>, paidPaise: number): string {
  const balance = b.total_paise - b.advance_paise;
  return `
    <h2 style="font-weight:400">Your booking is confirmed</h2>
    <p>Hi ${b.contact_name}, we've received your payment and your date is locked in.</p>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:4px 16px 4px 0;color:#666">Date</td><td>${onDate(b.starts_at)}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#666">Location</td><td>${b.location_note || "—"}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#666">Paid</td><td>${rupees(paidPaise)}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#666">Balance on the day</td><td>${b.pay_mode === "full" ? "Nothing — paid in full" : rupees(balance)}</td></tr>
    </table>
    <p style="margin-top:16px">We'll message you on WhatsApp a few days before to plan the details.</p>
    <p style="color:#666;font-size:13px">
      Need to change the date? Just reply or message us — rescheduling is free.
    </p>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!secret) return new Response("Not configured", { status: 500 });

  // The raw body must be read before parsing — the signature covers the exact
  // bytes Razorpay sent, so re-serialising the JSON would break it.
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const expected = await hmacHex(secret, raw);

  if (!signature || !safeEqual(signature, expected)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: {
    event: string;
    payload?: { payment?: { entity?: Record<string, unknown> } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id as string | undefined;
  const paymentId = payment?.id as string | undefined;
  if (!orderId) return new Response("ok", { status: 200 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: paymentRow } = await supabase
    .from("payments")
    .select("id, booking_id, status, amount_paise")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  // Unknown order, or already handled. Razorpay retries webhooks, so repeats
  // are normal and must not double-process.
  if (!paymentRow) return new Response("ok", { status: 200 });

  if (event.event === "payment.captured") {
    if (paymentRow.status === "paid") return new Response("ok", { status: 200 });

    await supabase
      .from("payments")
      .update({
        status: "paid",
        razorpay_payment_id: paymentId,
        raw: payment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRow.id);

    const { data: booking } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        // Confirmed bookings are permanent; nothing should expire them.
        hold_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRow.booking_id)
      .select("*")
      .single();

    // Add to Google Calendar. Best-effort — a calendar failure must not fail
    // the webhook, or Razorpay would retry and risk double-processing.
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/add-to-calendar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: paymentRow.booking_id }),
      });
    } catch {
      /* ignore */
    }

    // ---- notify both sides ----
    // Claim the send first. The unique idempotency key means a retried webhook
    // loses the race and skips, so nobody gets the same email twice.
    if (booking) {
      const { error: claimError } = await supabase.from("notifications").insert({
        booking_id: booking.id,
        channel: "email",
        template: "booking_confirmed",
        idempotency_key: `confirmed:${booking.id}`,
        status: "pending",
      });

      if (!claimError) {
        const studioTo = Deno.env.get("NOTIFY_EMAIL") ?? "";
        const paid = paymentRow.amount_paise;

        const studioSent = await sendEmail(
          studioTo,
          `New booking — ${booking.contact_name}, ${onDate(booking.starts_at)}`,
          studioEmail(booking, paid)
        );

        const customerSent = booking.contact_email
          ? await sendEmail(
              booking.contact_email,
              "Your booking is confirmed",
              customerEmail(booking, paid)
            )
          : false;

        await supabase
          .from("notifications")
          .update({
            status: studioSent || customerSent ? "sent" : "failed",
            sent_at: new Date().toISOString(),
            error: studioSent ? null : "studio email not sent",
            payload: { studioSent, customerSent },
          })
          .eq("idempotency_key", `confirmed:${booking.id}`);
      }
    }
  }

  if (event.event === "payment.failed") {
    await supabase
      .from("payments")
      .update({
        status: "failed",
        razorpay_payment_id: paymentId,
        raw: payment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRow.id);

    // Free the slot so somebody else can book it — but only if it never got
    // paid. A retry that succeeded must not be undone by a late failure event.
    await supabase
      .from("bookings")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", paymentRow.booking_id)
      .eq("status", "awaiting_payment");
  }

  return new Response("ok", { status: 200 });
});
