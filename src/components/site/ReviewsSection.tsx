import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { fetchApprovedReviews, type PublicReview } from "@/lib/reviews-api";
import { SectionHeading } from "./parts";

function initials(name: string): string {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const ReviewsSection = () => {
  const { config } = useSiteConfig();
  const { reviews } = config;
  const [approved, setApproved] = useState<PublicReview[]>([]);

  // Real approved reviews from the database take priority; the config's manual
  // reviews are the fallback for a studio that hasn't collected any yet.
  useEffect(() => {
    let active = true;
    fetchApprovedReviews().then((r) => active && setApproved(r));
    return () => {
      active = false;
    };
  }, []);

  const items = approved.length
    ? approved.map((r, i) => ({ id: `db-${i}`, ...r }))
    : reviews.items;

  if (!reviews.enabled || !items.length) return null;

  return (
    <section className="shell py-12 md:py-14">
      <SectionHeading heading={reviews.heading} highlight={reviews.headingHighlight} />

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((r) => (
          <figure
            key={r.id}
            className="flex flex-col gap-3 rounded-[14px] border border-border bg-card p-5"
          >
            <div
              className="flex gap-0.5"
              role="img"
              aria-label={`${r.rating} out of 5 stars`}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                  fill={i < r.rating ? "hsl(var(--star))" : "none"}
                  stroke="hsl(var(--star))"
                />
              ))}
            </div>

            <blockquote className="text-[0.93rem] text-[hsl(var(--ink-soft))]">
              {r.text}
            </blockquote>

            <figcaption className="mt-auto flex items-center gap-2.5 pt-1">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[0.8rem] font-semibold text-secondary-foreground"
              >
                {initials(r.name)}
              </span>
              <span>
                <span className="block text-[0.87rem] font-semibold">{r.name}</span>
                <span className="block text-[0.76rem] text-muted-foreground">{r.meta}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
};

export default ReviewsSection;
