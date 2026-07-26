import { getSupabase } from "./supabase";

/** The booking states worth showing an admin, with display labels and intent. */
export const STATUS_META: Record<
  string,
  { label: string; tone: "good" | "warn" | "muted" | "bad" }
> = {
  confirmed: { label: "Confirmed", tone: "good" },
  completed: { label: "Completed", tone: "good" },
  delivered: { label: "Delivered", tone: "good" },
  reviewed: { label: "Reviewed", tone: "good" },
  awaiting_payment: { label: "Awaiting payment", tone: "warn" },
  held: { label: "Held", tone: "warn" },
  cancelled: { label: "Cancelled", tone: "muted" },
  expired: { label: "Expired", tone: "muted" },
  failed: { label: "Payment failed", tone: "bad" },
  refunded: { label: "Refunded", tone: "muted" },
};

export interface AdminBooking {
  id: string;
  status: string;
  createdAt: string;
  startsAt: string;
  serviceSlug: string;
  packageRef: string;
  slotId: string;
  payMode: "advance" | "full";
  totalPaise: number;
  advancePaise: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  location: string;
  notes: string;
  paymentStatus: string | null;
  paidPaise: number | null;
  razorpayPaymentId: string | null;
  galleryUrl: string | null;
  reviewStatus: string | null;
  paymentMethod: "online" | "cash";
}

interface Row {
  id: string;
  status: string;
  created_at: string;
  starts_at: string;
  service_slug: string;
  package_ref: string;
  slot_id: string;
  pay_mode: "advance" | "full";
  payment_method: "online" | "cash";
  total_paise: number;
  advance_paise: number;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  location_note: string;
  customer_notes: string;
  payments: {
    status: string;
    amount_paise: number;
    razorpay_payment_id: string | null;
  }[];
  galleries: { external_url: string | null; storage_path: string | null }[];
  reviews: { status: string }[];
}

function toBooking(r: Row): AdminBooking {
  // A booking can carry several payment rows over its life (advance, then
  // balance). The paid one is what the admin cares about at a glance.
  const paid = r.payments?.find((p) => p.status === "paid") ?? r.payments?.[0];
  return {
    id: r.id,
    status: r.status,
    createdAt: r.created_at,
    startsAt: r.starts_at,
    serviceSlug: r.service_slug,
    packageRef: r.package_ref,
    slotId: r.slot_id,
    payMode: r.pay_mode,
    totalPaise: r.total_paise,
    advancePaise: r.advance_paise,
    contactName: r.contact_name,
    contactPhone: r.contact_phone,
    contactEmail: r.contact_email,
    location: r.location_note,
    notes: r.customer_notes,
    paymentStatus: paid?.status ?? null,
    paidPaise: paid?.status === "paid" ? paid.amount_paise : null,
    razorpayPaymentId: paid?.razorpay_payment_id ?? null,
    galleryUrl: r.galleries?.[0]?.external_url ?? r.galleries?.[0]?.storage_path ?? null,
    reviewStatus: r.reviews?.[0]?.status ?? null,
    paymentMethod: r.payment_method ?? "online",
  };
}

/**
 * All bookings, newest first, each with its payment rows joined in.
 * Only an admin can read these — RLS enforces it server-side, so this call
 * returns nothing for a non-admin session rather than leaking data.
 */
export async function fetchAdminBookings(): Promise<AdminBooking[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id,status,created_at,starts_at,service_slug,package_ref,slot_id,pay_mode,payment_method,total_paise,advance_paise,contact_name,contact_phone,contact_email,location_note,customer_notes,payments(status,amount_paise,razorpay_payment_id),galleries(external_url,storage_path),reviews(status)"
    )
    .order("starts_at", { ascending: false });

  if (error || !data) return [];
  return (data as Row[]).map(toBooking);
}

export interface NewAdminBooking {
  name: string;
  phone: string;
  email: string;
  location: string;
  notes: string;
  serviceSlug: string;
  serviceName: string;
  packageRef: string;
  totalPaise: number;
  advancePercent: number;
  /** Single-day: startDay only. Range: startDay..endDay inclusive. */
  startDay: string;
  endDay: string;
  slotId: string;
  slotStart: string;
  slotEnd: string;
  status: string;
  /** How much cash has already been taken, if any. */
  cashKind: "none" | "advance" | "full";
}

/**
 * Create a booking by hand — for walk-ins, phone bookings, and offline weddings
 * the studio wants tracked alongside online ones. Only an admin can call this
 * (RLS), and admins may set any status, unlike the public path.
 */
export async function createAdminBooking(
  b: NewAdminBooking
): Promise<{ ok: true } | { ok: false; reason: "taken" | "error"; message: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, reason: "error", message: "Not connected." };

  const multiDay = b.endDay && b.endDay !== b.startDay;
  // A multi-day booking occupies whole days; a single-day one occupies its slot.
  const startsAt = new Date(
    `${b.startDay}T${multiDay ? "08:00" : b.slotStart}:00+05:30`
  );
  const endsAt = new Date(
    `${multiDay ? b.endDay : b.startDay}T${multiDay ? "19:00" : b.slotEnd}:00+05:30`
  );

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: b.status,
      total_paise: b.totalPaise,
      advance_paise: Math.round((b.totalPaise * b.advancePercent) / 100),
      pay_mode: b.cashKind === "full" ? "full" : "advance",
      payment_method: "cash",
      contact_name: b.name,
      contact_phone: b.phone,
      contact_email: b.email || null,
      location_note: b.location,
      customer_notes: b.notes,
      slot_id: multiDay ? "fullday" : b.slotId,
      service_slug: b.serviceSlug,
      package_ref: b.packageRef,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23P01") {
      return { ok: false, reason: "taken", message: "Those dates overlap an existing booking." };
    }
    return { ok: false, reason: "error", message: error.message };
  }

  // Record any cash already taken.
  if (b.cashKind !== "none" && booking) {
    const amount =
      b.cashKind === "full"
        ? b.totalPaise
        : Math.round((b.totalPaise * b.advancePercent) / 100);
    await supabase.from("payments").insert({
      booking_id: booking.id,
      kind: b.cashKind === "full" ? "balance" : "advance",
      amount_paise: amount,
      status: "paid",
      method: "cash",
    });
  }

  return { ok: true };
}

/** Move a booking to a new status. RLS lets only an admin do this. */
export async function updateBookingStatus(
  id: string,
  status: string
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

/**
 * Reschedule to a new date/slot. The database's overlap constraint rejects a
 * clash, so a double-book is impossible — the caller sees ok:false with reason.
 */
export async function rescheduleBooking(
  id: string,
  day: string,
  slot: { id: string; start: string; end: string }
): Promise<{ ok: true } | { ok: false; reason: "taken" | "error" }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, reason: "error" };
  const { error } = await supabase
    .from("bookings")
    .update({
      starts_at: new Date(`${day}T${slot.start}:00+05:30`).toISOString(),
      ends_at: new Date(`${day}T${slot.end}:00+05:30`).toISOString(),
      slot_id: slot.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (!error) return { ok: true };
  return { ok: false, reason: error.code === "23P01" ? "taken" : "error" };
}

/**
 * Record a cash payment and confirm the booking. Used when a customer paid in
 * person — the studio marks it received by hand, mirroring what the Razorpay
 * webhook does for online payments.
 */
export async function markCashReceived(
  bookingId: string,
  amountPaise: number,
  kind: "advance" | "balance"
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error: pErr } = await supabase.from("payments").insert({
    booking_id: bookingId,
    kind,
    amount_paise: amountPaise,
    status: "paid",
    method: "cash",
  });
  if (pErr) return false;

  const { error: bErr } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      hold_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);
  if (bErr) return false;

  // Add it to Google Calendar. Best-effort: a calendar hiccup must not make the
  // cash confirmation itself look like it failed.
  try {
    await supabase.functions.invoke("add-to-calendar", { body: { bookingId } });
  } catch {
    /* ignore — the booking is confirmed regardless */
  }
  return true;
}

/** Attach a gallery link and mark the booking delivered. */
export async function deliverGallery(
  bookingId: string,
  url: string
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error: gErr } = await supabase.from("galleries").upsert(
    {
      booking_id: bookingId,
      external_url: url,
      delivered_at: new Date().toISOString(),
    },
    { onConflict: "booking_id" }
  );
  if (gErr) return false;

  const { error: bErr } = await supabase
    .from("bookings")
    .update({ status: "delivered", updated_at: new Date().toISOString() })
    .eq("id", bookingId);
  return !bErr;
}
