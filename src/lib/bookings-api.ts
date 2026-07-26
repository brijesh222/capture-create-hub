import { getSupabase } from "./supabase";
import { parsePrice } from "./booking";
import type { PackageItem } from "@/types/site-config";

/** How long a submitted booking blocks the date while the studio confirms it. */
const PENDING_HOURS = 48;

export interface BusySlot {
  day: string;
  slotId: string;
}

export interface NewBooking {
  serviceSlug: string;
  serviceName: string;
  pack: PackageItem;
  /** YYYY-MM-DD */
  day: string;
  slotId: string;
  slotLabel: string;
  /** "HH:MM" local times from the slot config. */
  slotStart: string;
  slotEnd: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  notes: string;
  payMode: "advance" | "full";
  advancePercent: number;
}

/**
 * Slots already taken. Reads a view exposing only the date and slot — the
 * bookings table itself is unreadable to visitors, so no customer's name or
 * phone number can leak through the calendar.
 *
 * Returns null when availability could not be checked. Callers must treat that
 * as "unknown", never as "nothing is booked": showing every date as free
 * because a network call failed is how you double-book a wedding.
 */
export async function fetchBusySlots(): Promise<BusySlot[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    // The view itself excludes lapsed holds, so no sweep is needed here. It
    // used to call release_expired_holds(), but letting any visitor trigger a
    // write is needless exposure when a read-time filter does the same job.
    const { data, error } = await supabase.from("busy_slots").select("day,slot_id");
    if (error || !data) return null;

    return data.map((r: { day: string; slot_id: string }) => ({
      day: r.day,
      slotId: r.slot_id,
    }));
  } catch {
    return null;
  }
}

export type BookingResult =
  | { ok: true }
  | { ok: false; reason: "taken" | "offline" | "error"; message: string };

/**
 * Creates the booking. Returns "taken" when the database's overlap constraint
 * rejects it, which is what happens if someone else booked the same slot in the
 * seconds between the calendar loading and this submit.
 */
export async function createBooking(input: NewBooking): Promise<BookingResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      reason: "offline",
      message: "Booking storage isn't connected yet.",
    };
  }

  // Money is stored in paise, never rupees, to keep it in whole integers.
  const totalPaise = parsePrice(input.pack.price) * 100;
  const advancePaise =
    input.payMode === "full"
      ? totalPaise
      : Math.round((totalPaise * input.advancePercent) / 100);

  // The booking occupies exactly its slot's hours, so a morning shoot leaves
  // the evening bookable — while a "full day" slot spans both and blocks them.
  // Times are Asia/Kolkata; the database stores UTC.
  const startsAt = new Date(`${input.day}T${input.slotStart}:00+05:30`);
  const endsAt = new Date(`${input.day}T${input.slotEnd}:00+05:30`);
  const holdExpires = new Date(Date.now() + PENDING_HOURS * 60 * 60 * 1000);

  const { error } = await supabase.from("bookings").insert({
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: "held",
    hold_expires_at: holdExpires.toISOString(),
    total_paise: totalPaise,
    advance_paise: advancePaise,
    pay_mode: input.payMode,
    contact_name: input.name,
    contact_phone: input.phone,
    contact_email: input.email || null,
    location_note: input.location,
    customer_notes: input.notes,
    slot_id: input.slotId,
    service_slug: input.serviceSlug,
    package_ref: input.pack.id,
  });

  if (!error) return { ok: true };

  // 23P01 is exclusion_violation — the slot overlaps a live booking.
  if (error.code === "23P01") {
    return {
      ok: false,
      reason: "taken",
      message: "That date was just booked by someone else. Please pick another.",
    };
  }

  return {
    ok: false,
    reason: "error",
    message: error.message || "Couldn't save your booking. Please try again.",
  };
}
