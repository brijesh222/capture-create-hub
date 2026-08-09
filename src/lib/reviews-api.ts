import { getSupabase } from "./supabase";

export interface PublicReview {
  name: string;
  meta: string;
  instagram: string;
  rating: number;
  text: string;
  serviceSlug: string;
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
    .select("reviewer_name,meta,instagram,rating,body,service_slug")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    name: r.reviewer_name,
    meta: r.meta,
    instagram: r.instagram,
    rating: r.rating,
    text: r.body,
    serviceSlug: r.service_slug ?? "",
  }));
}

export interface AdminReview {
  id: string;
  name: string;
  meta: string;
  instagram: string;
  rating: number;
  text: string;
  serviceSlug: string;
  status: "pending" | "approved" | "hidden";
  createdAt: string;
}

/** Every review, for moderation. Admin-only via RLS. */
export async function fetchAllReviews(): Promise<AdminReview[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select("id,reviewer_name,meta,instagram,rating,body,service_slug,status,created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    name: r.reviewer_name,
    meta: r.meta,
    instagram: r.instagram,
    rating: r.rating,
    text: r.body,
    serviceSlug: r.service_slug ?? "",
    status: r.status,
    createdAt: r.created_at,
  }));
}

export interface ReviewFields {
  name: string;
  meta: string;
  instagram: string;
  rating: number;
  text: string;
  serviceSlug: string;
}

/** Admin creates a review directly (a testimonial). Shows once approved. */
export async function createAdminReview(
  input: ReviewFields,
  status: "approved" | "pending" = "approved"
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from("reviews").insert({
    booking_id: null,
    reviewer_name: input.name,
    meta: input.meta,
    instagram: input.instagram,
    rating: input.rating,
    body: input.text,
    service_slug: input.serviceSlug,
    status,
  });
  return !error;
}

/** Admin edits an existing review's text/details. */
export async function updateReview(
  id: string,
  input: Partial<ReviewFields>
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.reviewer_name = input.name;
  if (input.meta !== undefined) row.meta = input.meta;
  if (input.instagram !== undefined) row.instagram = input.instagram;
  if (input.rating !== undefined) row.rating = input.rating;
  if (input.text !== undefined) row.body = input.text;
  if (input.serviceSlug !== undefined) row.service_slug = input.serviceSlug;
  const { error } = await supabase.from("reviews").update(row).eq("id", id);
  return !error;
}

/** Admin permanently deletes a review. */
export async function deleteReview(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  return !error;
}

/** Approve / hide / re-queue a review. */
export async function setReviewStatus(
  id: string,
  status: "pending" | "approved" | "hidden"
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
  return !error;
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
  instagram: string;
  rating: number;
  text: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "Reviews aren't available right now." };

  const { error } = await supabase.from("reviews").insert({
    booking_id: input.bookingId,
    reviewer_name: input.name,
    meta: input.meta,
    instagram: input.instagram,
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

/**
 * Open review submission from the public site — not tied to a booking. Lands as
 * 'pending' and waits for admin approval before it can appear anywhere. Name and
 * text are required (the database enforces this too).
 */
export async function submitPublicReview(input: {
  name: string;
  meta: string;
  instagram: string;
  rating: number;
  text: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "Reviews aren't available right now." };

  if (!input.name.trim() || input.text.trim().length < 3) {
    return { ok: false, message: "Please add your name and a few words." };
  }

  const { error } = await supabase.from("reviews").insert({
    booking_id: null,
    reviewer_name: input.name.trim().slice(0, 80),
    meta: input.meta,
    instagram: input.instagram,
    rating: Math.min(5, Math.max(1, input.rating)),
    body: input.text.trim().slice(0, 2000),
    status: "pending",
  });

  if (!error) return { ok: true };
  return { ok: false, message: "Couldn't submit your review. Please try again." };
}
