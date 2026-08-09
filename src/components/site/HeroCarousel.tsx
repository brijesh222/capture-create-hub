import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import VideoEmbed from "./VideoEmbed";
import { toYouTubeEmbed } from "@/lib/video";
import type { HeroSlide } from "@/types/site-config";

/**
 * The hero cover slot as an auto-playing, swipeable carousel of images and
 * videos. Every slide fills the same 4/5 frame (cropped to cover, never
 * distorted). Auto-advance pauses while the visitor interacts.
 */
const HeroCarousel = ({
  slides,
  label,
  autoplay = false,
}: {
  slides: HeroSlide[];
  label: string;
  autoplay?: boolean;
}) => {
  const [api, setApi] = useState<CarouselApi>();

  // Only slides we can actually render.
  const valid = slides.filter((s) =>
    s.type === "video" ? Boolean(s.url && toYouTubeEmbed(s.url)) : Boolean(s.url)
  );

  useEffect(() => {
    if (!api || valid.length <= 1 || !autoplay) return;
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
    }, 4000);
    return () => {
      window.clearInterval(id);
      node.removeEventListener("pointerenter", onEnter);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, [api, valid.length, autoplay]);

  if (!valid.length) return null;

  return (
    <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
      <CarouselContent>
        {valid.map((s, i) => (
          <CarouselItem key={s.id}>
            <div className="aspect-[4/5] overflow-hidden rounded-[20px] border border-border bg-muted">
              {s.type === "video" ? (
                <VideoEmbed url={s.url} title={label} cover background className="h-full w-full" />
              ) : (
                <img
                  src={s.url}
                  alt={`${label} ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              )}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {valid.length > 1 ? (
        <>
          <CarouselPrevious className="left-3" />
          <CarouselNext className="right-3" />
        </>
      ) : null}
    </Carousel>
  );
};

export default HeroCarousel;
