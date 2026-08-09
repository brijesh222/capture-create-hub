import { cn } from "@/lib/utils";
import { resolveVideo } from "@/lib/video";
import VideoEmbed from "./VideoEmbed";

/**
 * A service's videos laid out on a responsive grid that fills the available
 * width. Landscape videos go full width (one) or two-up (several); vertical
 * Reels sit in a tighter multi-column grid. Invalid links are skipped, and the
 * whole block hides when empty.
 */
const CategoryVideos = ({ videos, title }: { videos?: string[]; title?: string }) => {
  const valid = (videos ?? []).filter((u) => resolveVideo(u));
  if (!valid.length) return null;

  const reels = valid.filter((u) => resolveVideo(u)?.portrait);
  const wides = valid.filter((u) => !resolveVideo(u)?.portrait);

  return (
    <div className="mb-8 flex flex-col gap-4">
      {wides.length ? (
        <div className={cn("grid gap-4", wides.length > 1 && "md:grid-cols-2")}>
          {wides.map((url, i) => (
            <VideoEmbed key={`w-${url}-${i}`} url={url} title={`${title ?? "Video"} ${i + 1}`} />
          ))}
        </div>
      ) : null}

      {reels.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {reels.map((url, i) => (
            <VideoEmbed key={`r-${url}-${i}`} url={url} title={`${title ?? "Reel"} ${i + 1}`} reel />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default CategoryVideos;
