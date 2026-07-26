import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";

const SiteHeader = ({ onBook }: { onBook: () => void }) => {
  const { config } = useSiteConfig();
  const [open, setOpen] = useState(false);
  const { links, ctaText } = config.nav;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      <div className="shell flex items-center gap-5 py-4">
        <a href="/" className="flex flex-col leading-none">
          {config.branding.logoUrl ? (
            <img
              src={config.branding.logoUrl}
              alt={config.branding.siteName}
              className="h-8 w-auto"
            />
          ) : (
            <>
              <span className="text-[1.02rem] font-semibold tracking-[-0.02em]">
                {config.branding.siteName}
              </span>
              {config.contact.location ? (
                <span className="mt-0.5 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {config.contact.location}
                </span>
              ) : null}
            </>
          )}
        </a>

        <nav className="ml-auto hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <a
              key={l.id}
              href={l.href}
              className="text-sm text-[hsl(var(--ink-soft))] transition-colors hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={onBook}
          className="ml-auto inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))] lg:ml-0"
        >
          {ctaText}
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="-mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <nav className="border-t border-border bg-background lg:hidden">
          <div className="shell flex flex-col py-2">
            {links.map((l) => (
              <a
                key={l.id}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-3 text-[0.95rem] text-[hsl(var(--ink-soft))] last:border-0"
              >
                {l.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
};

export default SiteHeader;
