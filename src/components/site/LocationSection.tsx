import { ArrowUpRight, MapPin } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { directionsLink, toMapsEmbed } from "@/lib/maps";
import { SectionHeading } from "./parts";

/**
 * A map + address block. The map comes from a Google Maps embed URL the admin
 * pastes, or is built from the address they type. Hidden until enabled and
 * given something to show.
 */
const LocationSection = () => {
  const { config } = useSiteConfig();
  const loc = config.location;
  const address = loc.address || config.contact.location;
  const embed = toMapsEmbed(loc.mapsEmbedUrl, address);

  if (!loc.enabled || !embed) return null;

  return (
    <section className="shell py-12 md:py-14">
      <SectionHeading heading={loc.heading} highlight={loc.headingHighlight} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr] lg:gap-8">
        <div className="flex flex-col gap-5 rounded-[20px] border border-border bg-card p-6 md:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-[1.05rem] font-semibold">Studio</h3>
            {address ? (
              <p className="mt-1.5 max-w-[22rem] text-[0.95rem] text-[hsl(var(--ink-soft))]">
                {address}
              </p>
            ) : null}
          </div>
          {address ? (
            <a
              href={directionsLink(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[0.9rem] font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))]"
            >
              Get directions
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[20px] border border-border">
          <iframe
            src={embed}
            title="Map to the studio"
            className="h-[300px] w-full md:h-full md:min-h-[360px]"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
