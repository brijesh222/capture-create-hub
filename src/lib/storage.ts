import { getSupabase } from "./supabase";

const BUCKET = "site-images";

/**
 * Turn a Google Drive *share* link into one that works as an <img> source.
 * A normal share URL (…/file/d/ID/view) renders an HTML page, not the image;
 * the uc?export=view form serves the file itself. Other URLs pass through
 * unchanged. Drive is still less reliable than uploading — it rate-limits —
 * but this gives a pasted Drive link a fighting chance.
 */
export function normalizeImageUrl(url: string): string {
  const u = url.trim();
  const m =
    u.match(/drive\.google\.com\/file\/d\/([^/]+)/) ||
    u.match(/drive\.google\.com\/open\?id=([^&]+)/) ||
    u.match(/[?&]id=([^&]+)/);
  if (u.includes("drive.google.com") && m) {
    return `https://drive.google.com/uc?export=view&id=${m[1]}`;
  }
  return u;
}

export interface UploadResult {
  ok: boolean;
  url?: string;
  message?: string;
}

/** Upload an image to the public bucket and return its permanent URL. */
export async function uploadImage(file: File): Promise<UploadResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "Storage isn't connected." };

  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "That file isn't an image." };
  }
  // Supabase free tier is generous but not infinite; keep single files sane.
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, message: "Image is over 8MB — please use a smaller one." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return { ok: false, message: error.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
