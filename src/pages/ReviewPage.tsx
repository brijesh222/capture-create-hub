import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Check, Star } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { submitReview } from "@/lib/reviews-api";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { cn } from "@/lib/utils";

/**
 * Public review form, reached from the link the studio sends after delivery:
 *   /review/<bookingId>?n=<name>&s=<service · place>
 * Name and context come from the query so the form needs no access to the
 * bookings table (which the public can't read).
 */
const ReviewPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [params] = useSearchParams();
  const { config } = useSiteConfig();

  const [name, setName] = useState(params.get("n") ?? "");
  const meta = params.get("s") ?? "";
  const [instagram, setInstagram] = useState("");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !name.trim()) {
      setError("Please add your name.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await submitReview({
      bookingId,
      name: name.trim(),
      meta,
      // Store a bare handle without the @ so the display can add it consistently.
      instagram: instagram.trim().replace(/^@/, ""),
      rating,
      text: text.trim(),
    });
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.message);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader onBook={() => {}} />
      <main className="shell flex justify-center py-16">
        <div className="w-full max-w-md">
          {done ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <Check className="h-7 w-7 text-primary" aria-hidden="true" />
              </span>
              <h1 className="text-xl font-light tracking-[-0.028em]">Thank you</h1>
              <p className="text-[0.95rem] text-[hsl(var(--ink-soft))]">
                Your review has been sent to {config.branding.siteName}. It'll appear on
                the site once approved.
              </p>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <div>
                <div className="eyebrow">{config.branding.siteName}</div>
                <h1 className="heading-lg mt-1 text-[1.6rem]">
                  How was your <strong>shoot?</strong>
                </h1>
                {meta ? (
                  <p className="mt-1 text-[0.9rem] text-muted-foreground">{meta}</p>
                ) : null}
              </div>

              <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    aria-checked={rating === n}
                    role="radio"
                  >
                    <Star
                      className="h-8 w-8"
                      fill={(hover || rating) >= n ? "hsl(var(--star))" : "none"}
                      stroke="hsl(var(--star))"
                    />
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="rv-name" className="text-[0.85rem] font-medium">
                  Your name
                </label>
                <input
                  id="rv-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-[0.9rem] outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label htmlFor="rv-insta" className="text-[0.85rem] font-medium">
                  Instagram <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="rv-insta"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@yourhandle"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-[0.9rem] outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label htmlFor="rv-text" className="text-[0.85rem] font-medium">
                  A few words <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  id="rv-text"
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What did you love about the shoot?"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-[0.9rem] outline-none focus:border-foreground"
                />
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <button
                type="submit"
                disabled={busy}
                className={cn(
                  "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-[0.92rem] font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))]",
                  busy && "opacity-60"
                )}
              >
                {busy ? "Sending…" : "Submit review"}
              </button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default ReviewPage;
