import { MessageCircle, Phone } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getWhatsAppLink, getCallLink } from "@/lib/site-config-utils";
import { useLocation } from "react-router-dom";

/**
 * Two floating buttons (WhatsApp + Call now) shown on every page except admin.
 */
const FloatingButtons = () => {
  const location = useLocation();
  const { config } = useSiteConfig();
  const whatsappLink = getWhatsAppLink(config);
  const callLink = getCallLink(config);

  if (location.pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 md:bottom-8 md:right-8">
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 focus:ring-offset-background"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
      <a
        href={callLink}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-gold transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        aria-label="Call now"
      >
        <Phone className="h-7 w-7" />
      </a>
    </div>
  );
};

export default FloatingButtons;
