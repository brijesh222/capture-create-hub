import { isYouTubeShort, toYouTubeEmbed } from "@/lib/video";
import VideoEmbed from "./VideoEmbed";

/**
 * A swipeable row of a service's videos. Reels render vertical (9:16) and
 * regular videos wide (16:9), so a mix sits together tidily. Scrolls sideways
 * on any screen; invalid links are skipped. Renders nothing when empty.
 */
const CategoryVideos = ({ videos, title }: { videos?: string[]; title?: string }) => {
  const valid = (videos ?? []).filter((u) => toYouTubeEmbed(u));
  if (!valid.length) return null;

  return (
    <div className="mb-8 flex snap-x gap-4 overflow-x-auto pb-3">
      {valid.map((url, i) => {
        const reel = isYouTubeShort(url);
        return (
          <div
            key={`${url}-${i}`}
            className={
              reel
                ? "w-[210px] shrink-0 snap-start sm:w-[250px]"
                : "w-[86%] shrink-0 snap-start sm:w-[460px]"
            }
          >
            <VideoEmbed url={url} title={`${title ?? "Video"} ${i + 1}`} reel={reel} />
          </div>
        );
      })}
    </div>
  );
};

export default CategoryVideos;
