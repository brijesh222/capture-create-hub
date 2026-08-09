import { useEffect, useState } from "react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import type { TeamMember } from "@/types/site-config";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

/** One round photo with name and role. */
function Member({ m }: { m: TeamMember }) {
  return (
    <figure className="flex flex-col items-center gap-3 text-center">
      <div
        className="h-32 w-32 rounded-full border border-border bg-muted bg-cover bg-center md:h-36 md:w-36"
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
  );
}

/**
 * Team section as a swipeable carousel. Drag/swipe on touch, arrow buttons on
 * desktop, and a gentle auto-advance that pauses while the visitor interacts.
 * Cards are sized so several show at once and the row centres when there are
 * only a few members.
 */
const TeamSection = () => {
  const { config } = useSiteConfig();
  const { team } = config;
  const [api, setApi] = useState<CarouselApi>();

  const autoScroll = team.autoScroll !== false;

  // Gentle auto-advance. Embla's own pointer handling pauses it during a drag;
  // we also pause on hover via the container's group so it never fights the user.
  useEffect(() => {
    if (!api || !autoScroll || team.members.length <= 1) return;
    let paused = false;
    const node = api.rootNode();
    const onEnter = () => (paused = true);
    const onLeave = () => (paused = false);
    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointerleave", onLeave);
    const id = window.setInterval(() => {
      if (paused) return;
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, 3200);
    return () => {
      window.clearInterval(id);
      node.removeEventListener("pointerenter", onEnter);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [api, autoScroll, team.members.length]);

  if (!team.enabled || !team.members.length) return null;

  // A short list shouldn't scroll — centre it and skip the carousel chrome.
  const few = team.members.length <= 4;

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

      {few ? (
        <div className="shell flex flex-wrap justify-center gap-x-10 gap-y-8 py-2">
          {team.members.map((m) => (
            <div key={m.id} className="w-36">
              <Member m={m} />
            </div>
          ))}
        </div>
      ) : (
        <div className="shell">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true, dragFree: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 py-2">
              {team.members.map((m) => (
                <CarouselItem
                  key={m.id}
                  className="basis-1/2 pl-4 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5"
                >
                  <Member m={m} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
          <p className="mt-3 text-center text-[0.78rem] text-muted-foreground md:hidden">
            Swipe to see more →
          </p>
        </div>
      )}
    </section>
  );
};

export default TeamSection;
