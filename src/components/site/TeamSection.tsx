import { useSiteConfig } from "@/context/SiteConfigContext";
import { SectionHeading } from "./parts";

/**
 * Team members as round photos that scroll continuously. The row is duplicated
 * so the marquee loops seamlessly; it pauses on hover and respects
 * prefers-reduced-motion (handled globally in index.css).
 */
const TeamSection = () => {
  const { config } = useSiteConfig();
  const { team } = config;

  if (!team.enabled || !team.members.length) return null;

  // Duplicate the list so the -50% translate loops without a visible jump.
  const loop = [...team.members, ...team.members];

  return (
    <section className="shell py-12 md:py-14">
      <SectionHeading
        heading={team.heading}
        highlight={team.headingHighlight}
        subheading={team.subheading}
      />

      <div className="group relative overflow-hidden">
        <div className="flex w-max gap-8 animate-scroll-left group-hover:[animation-play-state:paused]">
          {loop.map((m, i) => (
            <figure key={`${m.id}-${i}`} className="flex w-32 shrink-0 flex-col items-center gap-2 text-center">
              <div
                className="h-28 w-28 rounded-full border border-border bg-muted bg-cover bg-center"
                style={m.photoUrl ? { backgroundImage: `url(${m.photoUrl})` } : undefined}
                role="img"
                aria-label={m.name}
              />
              <figcaption>
                <span className="block text-[0.9rem] font-semibold">{m.name}</span>
                {m.role ? (
                  <span className="block text-[0.78rem] text-muted-foreground">{m.role}</span>
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
