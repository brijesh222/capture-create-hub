import { Check } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getWhatsAppLink } from "@/lib/site-config-utils";
import { toYouTubeEmbed } from "@/lib/video";
import { WhatsAppDot } from "./parts";
import VideoEmbed from "./VideoEmbed";
import heroFallback from "@/assets/hero-wedding.jpg";

const HeroSection = ({ onBook }: { onBook: () => void }) => {
  const { config } = useSiteConfig();
  const { hero } = config;
  const image = hero.backgroundImageUrl || heroFallback;
  const hasVideo = Boolean(hero.videoUrl && toYouTubeEmbed(hero.videoUrl));

  return (
    <section className="shell py-12 md:py-14">
      <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
        <div>
          {hero.tagline ? <div className="eyebrow">{hero.tagline}</div> : null}

          <h1 className="heading-xl mt-3.5">
            {hero.title}
            {hero.titleHighlight ? <strong>{hero.titleHighlight}</strong> : null}
          </h1>

          {hero.subtitle ? (
            <p className="mt-4 max-w-[27rem] text-[1.03rem] text-[hsl(var(--ink-soft))]">
              {hero.subtitle}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onBook}
              className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-[0.92rem] font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))]"
            >
              {hero.ctaBookText}
            </button>
            <a
              href={getWhatsAppLink(config)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-[0.92rem] font-medium text-foreground transition-colors hover:border-[hsl(var(--whatsapp))]"
            >
              <WhatsAppDot />
              {hero.ctaWhatsAppText}
            </a>
          </div>

          {config.heroTrustBadges.length ? (
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-1.5 text-[0.82rem] text-muted-foreground">
              {config.heroTrustBadges.map((badge) => (
                <li key={badge} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {badge}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {hasVideo ? (
          <VideoEmbed
            url={hero.videoUrl}
            title={hero.title || config.branding.siteName}
            cover
            background
            className="aspect-[4/5] rounded-[20px] border border-border bg-muted"
          />
        ) : (
          <div
            className="aspect-[4/5] rounded-[20px] bg-muted bg-cover bg-center"
            style={{ backgroundImage: `url(${image})` }}
            role="img"
            aria-label={hero.title || config.branding.siteName}
          />
        )}
      </div>
    </section>
  );
};

export default HeroSection;
