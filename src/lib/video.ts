/**
 * Turn any video link the studio pastes into something embeddable.
 *
 * Supports YouTube (watch / youtu.be / Shorts / embed / live), Instagram
 * (reels, posts, IGTV), Vimeo, and direct video files (.mp4 etc.). Returns null
 * when the text isn't a recognisable video link, so callers can hide the player.
 */

export type VideoKind = "youtube" | "instagram" | "vimeo" | "file";

export interface ResolvedVideo {
  kind: VideoKind;
  /** URL for an <iframe> (youtube / instagram / vimeo). */
  embedUrl: string;
  /** URL for a <video> tag (file kind only). */
  fileUrl?: string;
  /** True for vertical clips (Shorts, Reels) so they render in a tall frame. */
  portrait: boolean;
}

export function youTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function toYouTubeEmbed(url: string): string | null {
  const id = youTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

/** A YouTube Short is vertical, so it should render in a portrait frame. */
export function isYouTubeShort(url: string): boolean {
  return /youtube\.com\/shorts\//i.test(url || "");
}

/** Resolve any pasted link into an embeddable video, or null if unsupported. */
export function resolveVideo(url?: string): ResolvedVideo | null {
  const u = (url || "").trim();
  if (!u) return null;

  // YouTube (incl. Shorts)
  const yt = youTubeId(u);
  if (yt) {
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube.com/embed/${yt}`,
      portrait: isYouTubeShort(u),
    };
  }

  // Instagram reels / posts / IGTV
  const ig = u.match(/instagram\.com\/(reels?|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (ig) {
    const type = ig[1].toLowerCase().startsWith("reel") ? "reel" : ig[1].toLowerCase();
    return {
      kind: "instagram",
      embedUrl: `https://www.instagram.com/${type}/${ig[2]}/embed`,
      portrait: type === "reel" || type === "tv",
    };
  }

  // Vimeo
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vm) {
    return { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${vm[1]}`, portrait: false };
  }

  // Direct video file
  if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(u)) {
    return { kind: "file", embedUrl: "", fileUrl: u, portrait: false };
  }

  return null;
}
