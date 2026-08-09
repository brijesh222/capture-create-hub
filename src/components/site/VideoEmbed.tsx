import { cn } from "@/lib/utils";
import { youTubeId } from "@/lib/video";

/**
 * YouTube player. Two modes:
 *  - default: a responsive 16:9 player with controls (galleries, service pages).
 *  - cover:   fills the parent container in any aspect ratio, cropping to cover
 *             (used for the hero, so a video sits in the same 4/5 slot as the
 *             cover photo). Pair with `background` for autoplay-muted-loop and
 *             no controls, i.e. a silent background video.
 *
 * Renders nothing when the URL isn't a valid YouTube link, so a blank admin
 * field simply hides the video.
 */
const VideoEmbed = ({
  url,
  title,
  className,
  cover = false,
  background = false,
}: {
  url?: string;
  title?: string;
  className?: string;
  cover?: boolean;
  background?: boolean;
}) => {
  const id = url ? youTubeId(url) : null;
  if (!id) return null;

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (background) {
    params.set("autoplay", "1");
    params.set("mute", "1");
    params.set("loop", "1");
    params.set("playlist", id); // required for loop to work
    params.set("controls", "0");
  }
  const src = `https://www.youtube.com/embed/${id}?${params.toString()}`;

  const common = {
    src,
    title: title || "Video",
    allow:
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
    allowFullScreen: !background,
    loading: "lazy" as const,
  };

  if (cover) {
    // Fill the parent (which sets the aspect ratio) and crop the 16:9 video to
    // cover it. h-full + aspect-video derives the width; min-w-full guards the
    // narrow case; the parent clips the overflow.
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <iframe
          {...common}
          className={cn(
            "absolute left-1/2 top-1/2 aspect-video h-full w-auto min-w-full -translate-x-1/2 -translate-y-1/2",
            background && "pointer-events-none"
          )}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-[20px] border border-border bg-muted",
        className
      )}
    >
      <iframe {...common} className="absolute inset-0 h-full w-full" />
    </div>
  );
};

export default VideoEmbed;
