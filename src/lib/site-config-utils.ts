import type { SiteConfig, SectionId } from "@/types/site-config";

export function getWhatsAppLink(config: SiteConfig): string {
  return (
    config.redirections?.whatsappLink ||
    `https://wa.me/${config.contact.whatsappNumber?.replace(/\D/g, "") || "917023433374"}`
  );
}

export function getCallLink(config: SiteConfig): string {
  const num = config.contact.whatsappNumber?.replace(/\D/g, "") || "917023433374";
  return `tel:+${num}`;
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
