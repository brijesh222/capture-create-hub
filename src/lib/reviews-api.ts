import { getSupabase } from "./supabase";

export interface PublicReview {
  name: string;
  meta: string;
  rating: number;
  text: string;
}

/**
 * Approved reviews for the public site. Returns [] when offline so the site
 * falls back to whatever manual reviews are in the config.
 */
export async function fetchApprovedReviews(): Promise<PublicReview[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select("reviewer_name,meta,rating,body")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    name: r.reviewer_name,
    meta: r.meta,
    rating: r.rating,
    text: r.body,
  }));
}

/**
 * Submit a review for a booking. Always lands as 'pending' — the admin
 * approves before it can appear on the site. One review per booking (unique
 * booking_id), which also limits spam.
 */
export async function submitReview(input: {
  bookingId: string;
  name: string;
  meta: string;
  rating: number;
  text: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "Reviews aren't available right now." };

  const { error } = await supabase.from("reviews").insert({
    booking_id: input.bookingId,
    reviewer_name: input.name,
    meta: input.meta,
    rating: input.rating,
    body: input.text,
    status: "pending",
  });

  if (!error) return { ok: true };
  // Unique-violation = they already reviewed this booking.
  if (error.code === "23505") {
    return { ok: false, message: "You've already left a review for this shoot — thank you!" };
  }
  return { ok: false, message: "Couldn't submit your review. Please try again." };
}
