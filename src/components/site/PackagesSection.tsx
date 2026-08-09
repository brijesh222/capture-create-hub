import { Check } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { SectionHeading, PackagePrice } from "./parts";
import { cn } from "@/lib/utils";

const PackagesSection = ({ onBook }: { onBook: (packageId: string) => void }) => {
  const { config } = useSiteConfig();
  const { packages } = config;

  if (!packages.enabled || !packages.items.length) return null;

  return (
    <section className="shell py-12 md:py-14">
      <SectionHeading
        heading={packages.heading}
        highlight={packages.headingHighlight}
        subheading={packages.subheading}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {packages.items.map((pack) => (
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

            <PackagePrice
              price={pack.price}
              originalPrice={pack.originalPrice}
              priceNote={pack.priceNote}
            />

            <ul className="flex flex-col gap-2 py-1 text-[0.9rem] text-[hsl(var(--ink-soft))]">
              {pack.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
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
    </section>
  );
};

export default PackagesSection;
