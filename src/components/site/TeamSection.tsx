import { useSiteConfig } from "@/context/SiteConfigContext";
import type { TeamMember } from "@/types/site-config";

/** One round photo with name and role. */
function Member({ m }: { m: TeamMember }) {
  return (
    <figure className="flex w-36 shrink-0 flex-col items-center gap-2.5 text-center">
      <div
        className="h-32 w-32 rounded-full border border-border bg-muted bg-cover bg-center"
        style={m.photoUrl ? { backgroundImage: `url(${m.photoUrl})` } : undefined}
        role="img"
        aria-label={m.name}
      />
      <figcaption>
        <span className="block text-[0.95rem] font-semibold">{m.name}</span>
        {m.role ? <span className="block text-[0.8rem] text-muted-foreground">{m.role}</span> : null}
      </figcaption>
    </figure>
  );
}

/**
 * Full-width team section. A short list is centred and static; a longer list
 * (6+) scrolls continuously as a marquee. This avoids the "one lonely photo
 * scrolling through empty space" look when there are only a few members.
 * Heading and photos are centred.
 */
const TeamSection = () => {
  const { config } = useSiteConfig();
  const { team } = config;

  if (!team.enabled || !team.members.length) return null;

  const scroll = team.members.length >= 6;
  // Duplicate for a seamless marquee loop only when scrolling.
  const marquee = [...team.members, ...team.members];

  return (
    <section className="py-12 md:py-14">
      <div className="shell mb-8 flex flex-col items-center gap-2 text-center">
        <h2 className="heading-lg">
          {team.heading}
          {team.headingHighlight ? <strong>{team.headingHighlight}</strong> : null}
        </h2>
        {team.subheading ? (
          <p className="text-[0.97rem] text-muted-foreground">{team.subheading}</p>
        ) : null}
      </div>

      {scroll ? (
        <div className="group relative w-full overflow-x-hidden py-2">
          <div className="flex w-max gap-10 px-5 animate-scroll-left group-hover:[animation-play-state:paused]">
            {marquee.map((m, i) => (
              <Member key={`${m.id}-${i}`} m={m} />
            ))}
          </div>
        </div>
      ) : (
        <div className="shell flex flex-wrap justify-center gap-10 py-2">
          {team.members.map((m) => (
            <Member key={m.id} m={m} />
          ))}
        </div>
      )}
    </section>
  );
};

export default TeamSection;
