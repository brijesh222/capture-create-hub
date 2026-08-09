/**
 * Build a Google Maps embed URL from whatever the admin provides:
 *  - a full embed URL (…/maps/embed?pb=…) → used as-is
 *  - a pasted <iframe src="…"> block → the src is extracted
 *  - a normal maps link → gets &output=embed appended
 *  - a plain address or place name → turned into a query embed
 *
 * Returns null when there's nothing usable, so the section can hide itself.
 */
export function toMapsEmbed(embedUrl?: string, address?: string): string | null {
  const raw = (embedUrl || "").trim();
  if (raw) {
    // If they pasted a whole <iframe …>, pull out the src attribute.
    const iframeSrc = raw.match(/src=["']([^"']+)["']/i);
    const url = iframeSrc ? iframeSrc[1] : raw;
    // Only a real embed URL can go straight into an iframe. Google's short
    // share links (goo.gl/maps, maps.app.goo.gl) and normal place URLs are
    // blocked by X-Frame-Options — using them would show a blank frame — so we
    // ignore those and fall through to building an embed from the address.
    if (/^https?:\/\//i.test(url) && /\/maps\/embed|[?&]output=embed/i.test(url)) {
      return url;
    }
    // A plain lat,lng pair pasted into the box → pin it precisely.
    if (/^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+$/.test(raw)) {
      return `https://www.google.com/maps?q=${encodeURIComponent(raw)}&output=embed`;
    }
  }
  const addr = (address || "").trim();
  if (addr) {
    return `https://www.google.com/maps?q=${encodeURIComponent(addr)}&output=embed`;
  }
  return null;
}

/** A link that opens directions to the address in Google Maps. */
export function directionsLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
