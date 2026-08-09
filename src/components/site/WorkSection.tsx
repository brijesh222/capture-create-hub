import { useMemo } from "react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getCategoryThumbnail } from "@/lib/category-images";
import { SectionHeading } from "./parts";
import PhotoGrid, { type GridPhoto } from "./PhotoGrid";
import VideoEmbed from "./VideoEmbed";

/**
 * Until the studio curates a featured set, fall back to each category's cover
 * photo so the section is never empty on a fresh install.
 */
function derivePhotos(
  categories: { id: string; name: string; slug: string; thumbnailUrl: string }[]
): GridPhoto[] {
  return categories.map((c) => ({
    id: `derived-${c.id}`,
    url: getCategoryThumbnail(c.thumbnailUrl, c.slug),
    caption: c.name,
  }));
}

const WorkSection = () => {
  const { config } = useSiteConfig();
  const { work } = config;

  const photos: GridPhoto[] = useMemo(
    () =>
      work.photos.length
        ? work.photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption }))
        : derivePhotos(config.categories.filter((c) => c.visible !== false)),
    [work.photos, config.categories]
  );

  if (!work.enabled || !photos.length) return null;

  return (
    <section id="work" className="shell py-12 md:py-14">
      <SectionHeading
        heading={work.heading}
        highlight={work.headingHighlight}
        subheading={work.subheading}
      />

      {work.videoUrl ? (
        <div className="mx-auto mb-8 max-w-3xl">
          <VideoEmbed url={work.videoUrl} title={`${work.heading}${work.headingHighlight}`} />
        </div>
      ) : null}

      <PhotoGrid photos={photos} alt="Photograph" initialCount={12} step={12} />

      {work.ctaText ? (
        <div className="mt-6 flex justify-center">
          <a
            href={work.ctaHref}
            className="inline-flex items-center rounded-full border border-border px-6 py-3 text-[0.92rem] font-medium transition-colors hover:border-foreground"
          >
            {work.ctaText}
          </a>
        </div>
      ) : null}
    </section>
  );
};

export default WorkSection;
