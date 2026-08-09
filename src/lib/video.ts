/**
 * Turn any YouTube link the studio pastes into an embeddable player URL.
 *
 * Accepts the usual shapes — watch?v=, youtu.be/, /shorts/, /embed/, and links
 * carrying extra query params — and returns the /embed/ URL, or null when the
 * text isn't a recognisable YouTube link (so callers can hide the player).
 */
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
