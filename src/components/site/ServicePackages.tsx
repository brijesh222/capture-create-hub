import { Check, MessageCircle } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getWhatsAppLink } from "@/lib/site-config-utils";
import { SectionHeading } from "./parts";
import { cn } from "@/lib/utils";

/**
 * Packages for one service. Falls back to packages with no service set, so a
 * newly added service still shows something rather than an empty section.
 */
const ServicePackages = ({
  serviceSlug,
  serviceName,
  onBook,
}: {
  serviceSlug: string;
  serviceName: string;
  /** Carries the chosen package into the form instead of opening it blank. */
  onBook: (packageId: string) => void;
}) => {
  const { config } = useSiteConfig();

  const forService = config.packages.items.filter((p) => p.serviceSlug === serviceSlug);
  const generic = config.packages.items.filter((p) => !p.serviceSlug);
  const items = forService.length ? forService : generic;

  return (
    <section id="packages" className="shell py-12 md:py-14">
      <SectionHeading
        heading={`${serviceName} `}
        highlight="packages"
        subheading="Everything is included in the price shown. Travel outside Rajasthan is added at actual cost."
      />

      {items.length ? (
        <div
          className={cn(
            "grid gap-4",
            items.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"
          )}
        >
          {items.map((pack) => (
            <div
              key={pack.id}
              className={cn(
                "flex flex-col gap-3.5 rounded-[20px] border bg-card p-6",
                pack.featured ? "border-primary" : "border-border"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[1.05rem] font-semibold">{pack.name}</span>
                {pack.tag ? (
                  <span className="whitespace-nowrap rounded-full bg-secondary px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-secondary-foreground">
                    {pack.tag}
                  </span>
                ) : null}
              </div>

              <div>
                <div className="text-[1.85rem] font-light tabular-nums tracking-[-0.03em]">
                  {pack.price}
                </div>
                {pack.priceNote ? (
                  <div className="mt-0.5 text-[0.82rem] text-muted-foreground">
                    {pack.priceNote}
                  </div>
                ) : null}
              </div>

              <ul className="flex flex-col gap-2 py-1 text-[0.9rem] text-[hsl(var(--ink-soft))]">
                {pack.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onBook(pack.id)}
                className={cn(
                  "mt-auto inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-[0.92rem] font-medium transition-colors",
                  pack.featured
                    ? "bg-primary text-primary-foreground hover:bg-[hsl(var(--gold-dark))]"
                    : "border border-border hover:border-foreground"
                )}
              >
                {pack.ctaText}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-[20px] border border-border bg-card p-6">
          <p className="text-[0.95rem] text-[hsl(var(--ink-soft))]">
            Every {serviceName.toLowerCase()} shoot is quoted to the day, the location
            and how long you need us. Tell us what you have in mind and we'll send a
            price the same day.
          </p>
          <a
            href={getWhatsAppLink(config)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.92rem] font-medium text-primary-foreground"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Ask for a quote
          </a>
        </div>
      )}
    </section>
  );
};

export default ServicePackages;
