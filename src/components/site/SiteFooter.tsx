import { Link } from "react-router-dom";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getCallLink, getWhatsAppLink } from "@/lib/site-config-utils";

const SiteFooter = () => {
  const { config } = useSiteConfig();
  const { contact, branding } = config;
  const services = config.categories.filter((c) => c.visible !== false).slice(0, 5);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-4 bg-foreground text-[hsl(var(--background))]">
      <div className="shell">
        <div className="grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12">
          <div>
            <span className="block text-[1.05rem] font-semibold">
              {contact.footerBrandName || branding.siteName}
            </span>
            <p className="mt-2 max-w-[20rem] text-[0.88rem] opacity-60">
              {contact.footerTagline}
            </p>
          </div>

          <nav>
            <h2 className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] opacity-60">
              Services
            </h2>
            {services.map((s) => (
              <Link
                key={s.id}
                to={`/category/${s.slug}`}
                className="block py-1 text-[0.9rem] opacity-85 transition-opacity hover:opacity-100"
              >
                {s.name}
              </Link>
            ))}
          </nav>

          <div>
            <h2 className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] opacity-60">
              Get in touch
            </h2>
            {contact.whatsappNumber ? (
              <a
                href={getCallLink(config)}
                className="block py-1 text-[0.9rem] opacity-85 transition-opacity hover:opacity-100"
              >
                +{contact.whatsappNumber.replace(/\D/g, "")}
              </a>
            ) : null}
            {contact.email ? (
              <a
                href={`mailto:${contact.email}`}
                className="block py-1 text-[0.9rem] opacity-85 transition-opacity hover:opacity-100"
              >
                {contact.email}
              </a>
            ) : null}
            {contact.location ? (
              <span className="block py-1 text-[0.9rem] opacity-85">{contact.location}</span>
            ) : null}
            <a
              href={getWhatsAppLink(config)}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 text-[0.9rem] opacity-85 transition-opacity hover:opacity-100"
            >
              WhatsApp
            </a>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-white/10 py-5 text-[0.8rem] opacity-50 max-md:pb-24">
          <span>
            © {year} {contact.footerCopyrightPrefix || branding.siteName}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
