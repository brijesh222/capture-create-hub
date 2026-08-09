import { cn } from "@/lib/utils";
import { resolveVideo } from "@/lib/video";

/**
 * Plays a video from any supported link — YouTube (incl. Shorts), Instagram
 * (reels/posts), Vimeo, or a direct video file. Two modes:
 *  - default: a player with controls, sized 16:9 or 9:16 (vertical).
 *  - cover:   fills the parent in any aspect (used for the hero). Pair with
 *             `background` for autoplay-muted-loop, no controls, where the
 *             source supports it (YouTube, Vimeo, direct files).
 *
 * Renders nothing when the URL isn't a recognisable video link.
 */
const VideoEmbed = ({
  url,
  title,
  className,
  cover = false,
  background = false,
  reel = false,
}: {
  url?: string;
  title?: string;
  className?: string;
  cover?: boolean;
  background?: boolean;
  reel?: boolean;
}) => {
  const v = url ? resolveVideo(url) : null;
  if (!v) return null;

  const portrait = reel || v.portrait;
  const noInteract = background ? "pointer-events-none" : "";

  // ---- build the media element ----
  let media: JSX.Element;

  if (v.kind === "file") {
    media = (
      <video
        src={v.fileUrl}
        className={cn(
          cover ? "absolute inset-0 h-full w-full object-cover" : "absolute inset-0 h-full w-full",
          noInteract
        )}
        autoPlay={background}
        muted={background}
        loop={background}
        controls={!background}
        playsInline
      />
    );
  } else {
    let src = v.embedUrl;
    if (v.kind === "youtube") {
      const id = v.embedUrl.split("/embed/")[1] ?? "";
      const p = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
      if (background) {
        p.set("autoplay", "1");
        p.set("mute", "1");
        p.set("loop", "1");
        p.set("playlist", id);
        p.set("controls", "0");
      }
      src = `${v.embedUrl}?${p.toString()}`;
    } else if (v.kind === "vimeo" && background) {
      src = `${v.embedUrl}?autoplay=1&muted=1&loop=1&background=1`;
    }

    // YouTube/Vimeo are 16:9 sources — in cover mode they scale to fill and crop.
    // Instagram embeds carry their own layout, so they just fill the box.
    const coverClass =
      v.kind === "youtube" || v.kind === "vimeo"
        ? "absolute left-1/2 top-1/2 aspect-video h-full w-auto min-w-full -translate-x-1/2 -translate-y-1/2"
        : "absolute inset-0 h-full w-full";

    media = (
      <iframe
        src={src}
        title={title || "Video"}
        className={cn(cover ? coverClass : "absolute inset-0 h-full w-full", noInteract)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen={!background}
        loading="lazy"
      />
    );
  }

  if (cover) {
    return <div className={cn("relative overflow-hidden", className)}>{media}</div>;
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[20px] border border-border bg-muted",
        portrait ? "aspect-[9/16]" : "aspect-video",
        className
      )}
    >
      {media}
    </div>
  );
};

export default VideoEmbed;
