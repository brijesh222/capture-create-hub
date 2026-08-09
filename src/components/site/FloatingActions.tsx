import { Instagram, MessageCircle, Phone } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getCallLink, getWhatsAppLink } from "@/lib/site-config-utils";
import { WhatsAppDot } from "./parts";

/**
 * Persistent ways to get in touch: round buttons on every screen (WhatsApp,
 * Instagram, Call), plus a bottom bar on phones where reaching the header is
 * awkward mid-scroll.
 */
const FloatingActions = ({ onBook }: { onBook: () => void }) => {
  const { config } = useSiteConfig();
  const whatsapp = getWhatsAppLink(config);
  const instagram = config.contact.instagram?.replace(/^@/, "").trim();

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2.5 max-md:bottom-[4.9rem]">
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Message us on WhatsApp"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--whatsapp))] text-white shadow-lg transition-transform hover:scale-105"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </a>
        {instagram ? (
          <a
            href={`https://instagram.com/${instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow us on Instagram"
            className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105"
            style={{
              background:
                "linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)",
            }}
          >
            <Instagram className="h-5 w-5" aria-hidden="true" />
          </a>
        ) : null}
        <a
          href={getCallLink(config)}
          aria-label="Call us"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-transform hover:scale-105"
        >
          <Phone className="h-5 w-5" aria-hidden="true" />
        </a>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border bg-background/95 p-2.5 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={onBook}
          className="flex-1 rounded-full bg-primary px-5 py-3 text-[0.9rem] font-medium text-primary-foreground"
        >
          {config.nav.ctaText}
        </button>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-[0.9rem] font-medium"
        >
          <WhatsAppDot />
          WhatsApp
        </a>
      </div>
    </>
  );
};

export default FloatingActions;
