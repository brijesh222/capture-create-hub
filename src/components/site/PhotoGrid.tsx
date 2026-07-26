import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface GridPhoto {
  id: string;
  url: string;
  caption?: string;
}

/**
 * Masonry gallery.
 *
 * Uses CSS multi-column rather than a fixed-ratio grid so every photo keeps its
 * own shape — a portrait stays portrait. The tradeoff is that photos read down
 * each column instead of across rows, which is fine for a gallery.
 *
 * Photos load in batches and lazily, so a service with 200 images doesn't make
 * the browser fetch all of them at once.
 */
const PhotoGrid = ({
  photos,
  alt,
  initialCount = 12,
  step = 12,
}: {
  photos: GridPhoto[];
  alt: string;
  initialCount?: number;
  step?: number;
}) => {
  const [shown, setShown] = useState(initialCount);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // A shorter list (switching service, admin removing photos) must not leave
  // the "See more" button showing a count that no longer exists.
  useEffect(() => {
    setShown((s) => Math.min(s, Math.max(initialCount, photos.length)));
  }, [photos.length, initialCount]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft")
        setLightbox((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, photos.length]);

  if (!photos.length) return null;

  const visible = photos.slice(0, shown);
  const remaining = photos.length - visible.length;

  return (
    <>
      <div className="columns-2 gap-2.5 md:columns-3 lg:columns-4 lg:gap-3.5">
        {visible.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightbox(i)}
            className="mb-2.5 block w-full overflow-hidden rounded-[14px] bg-muted lg:mb-3.5"
            style={{ breakInside: "avoid" }}
            aria-label={photo.caption || `${alt} ${i + 1} — view larger`}
          >
            <img
              src={photo.url}
              alt={photo.caption || `${alt} ${i + 1}`}
              loading="lazy"
              decoding="async"
              className="w-full transition-transform duration-300 hover:scale-[1.02]"
            />
          </button>
        ))}
      </div>

      {remaining > 0 ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((s) => s + step)}
            className="inline-flex items-center rounded-full border border-border px-6 py-3 text-[0.92rem] font-medium transition-colors hover:border-foreground"
          >
            See more ({remaining})
          </button>
        </div>
      ) : null}

      {lightbox !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={photos[lightbox].caption || alt}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          {photos.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
                }}
                className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((i) => (i === null ? i : (i + 1) % photos.length));
                }}
                className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>
            </>
          ) : null}

          <figure
            className="flex max-h-full flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightbox].url}
              alt={photos[lightbox].caption || alt}
              className="max-h-[82vh] w-auto max-w-full rounded-lg object-contain"
            />
            {photos[lightbox].caption ? (
              <figcaption className="text-sm text-white/70">
                {photos[lightbox].caption}
              </figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}
    </>
  );
};

export default PhotoGrid;
