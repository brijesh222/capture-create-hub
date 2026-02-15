import { useSiteConfig } from "@/context/SiteConfigContext";
import { getWhatsAppLink, getSectionStyle } from "@/lib/site-config-utils";
import { Link } from "react-router-dom";

const Footer = () => {
  const { config } = useSiteConfig();
  const contact = config.contact;
  const categories = config.categories;
  const whatsappLink = getWhatsAppLink(config);
  const sectionStyle = getSectionStyle(config, "footer");
  const brandName = config.branding?.siteName || contact.footerBrandName;

  return (
    <footer
      className="border-t border-border bg-card px-6 py-12"
      style={sectionStyle}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-3 font-display text-xl font-bold text-gradient-gold">
              {brandName}
            </h3>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">
              {contact.footerTagline}
            </p>
          </div>

          <div>
            <h4 className="mb-3 font-body text-sm font-semibold uppercase tracking-wider text-foreground">
              Services
            </h4>
            <ul className="space-y-2">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="font-body text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-body text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact
            </h4>
            <ul className="space-y-2 font-body text-sm text-muted-foreground">
              <li>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  +91 {contact.whatsappNumber?.replace(/\D/g, "").slice(-10)}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="transition-colors hover:text-primary"
                >
                  {contact.email}
                </a>
              </li>
              <li>{contact.location}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center">
          <p className="font-body text-xs text-muted-foreground">
            © {new Date().getFullYear()} {contact.footerCopyrightPrefix}. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
