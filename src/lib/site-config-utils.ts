import type { SiteConfig, SectionId } from "@/types/site-config";

/**
 * Turn whatever the admin typed into a clean, dialable number: digits only,
 * with an India country code. Accepts "+91 70234 33374", "7023433374",
 * "917023433374" — all become "917023433374". A bare 10-digit mobile gets 91
 * added; anything already carrying a country code is left as-is.
 */
export function normalisePhone(raw?: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "917023433374";
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function getWhatsAppLink(config: SiteConfig): string {
  // Always derived from the admin's number so editing it in the panel takes
  // effect immediately. (A stale redirections.whatsappLink used to win here and
  // silently ignore number changes.) wa.me works on both mobile and desktop.
  return `https://wa.me/${normalisePhone(config.contact.whatsappNumber)}`;
}

export function getCallLink(config: SiteConfig): string {
  return `tel:+${normalisePhone(config.contact.whatsappNumber)}`;
}

export function getSectionStyle(
  config: SiteConfig,
  sectionId: SectionId
): React.CSSProperties {
  const s = config.sectionStyles?.[sectionId];
  if (!s) return {};
  const style: React.CSSProperties = {};
  if (s.backgroundColor) style.backgroundColor = s.backgroundColor;
  if (s.borderColor) style.borderColor = s.borderColor;
  if (s.shadow) style.boxShadow = s.shadow;
  return style;
}
