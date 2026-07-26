import { useSiteConfig } from "@/context/SiteConfigContext";

/**
 * Team members as round photos scrolling continuously across the full width of
 * the page. The heading stays within the normal content column; the marquee
 * itself runs edge to edge. The row is duplicated so the loop is seamless; it
 * pauses on hover and respects prefers-reduced-motion (handled in index.css).
 */
const TeamSection = () => {
  const { config } = useSiteConfig();
  const { team } = config;

  if (!team.enabled || !team.members.length) return null;

  const loop = [...team.members, ...team.members];

  return (
    <section className="py-12 md:py-14">
      <div className="shell mb-8 flex max-w-[38rem] flex-col gap-2">
        <h2 className="heading-lg">
          {team.heading}
          {team.headingHighlight ? <strong>{team.headingHighlight}</strong> : null}
        </h2>
        {team.subheading ? (
          <p className="text-[0.97rem] text-muted-foreground">{team.subheading}</p>
        ) : null}
      </div>

      {/* Full-bleed marquee. */}
      <div className="group relative w-full overflow-hidden">
        <div className="flex w-max gap-10 animate-scroll-left px-5 group-hover:[animation-play-state:paused]">
          {loop.map((m, i) => (
            <figure
              key={`${m.id}-${i}`}
              className="flex w-36 shrink-0 flex-col items-center gap-2.5 text-center"
            >
              <div
                className="h-32 w-32 rounded-full border border-border bg-muted bg-cover bg-center"
                style={m.photoUrl ? { backgroundImage: `url(${m.photoUrl})` } : undefined}
                role="img"
                aria-label={m.name}
              />
              <figcaption>
                <span className="block text-[0.95rem] font-semibold">{m.name}</span>
                {m.role ? (
                  <span className="block text-[0.8rem] text-muted-foreground">{m.role}</span>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
