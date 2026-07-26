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
      "id,status,created_at,starts_at,service_slug,package_ref,slot_id,pay_mode,total_paise,advance_paise,contact_name,contact_phone,contact_email,location_note,customer_notes,payments(status,amount_paise,razorpay_payment_id)"
    )
    .order("starts_at", { ascending: false });

  if (error || !data) return [];
  return (data as Row[]).map(toBooking);
}
