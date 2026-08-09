import { useState } from "react";
import { Loader2, Star, X } from "lucide-react";
import { submitPublicReview } from "@/lib/reviews-api";

/**
 * Open "leave a review" form. Submissions land as pending and only appear on the
 * site after the studio approves them. A hidden honeypot field quietly drops the
 * most basic bots without bothering real visitors.
 */
const ReviewForm = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [name, setName] = useState("");
  const [meta, setMeta] = useState("");
  const [instagram, setInstagram] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const submit = async () => {
    setError("");
    // A bot filled the hidden field — pretend it worked, save nothing.
    if (website.trim()) {
      setDone(true);
      return;
    }
    setSubmitting(true);
    const res = await submitPublicReview({
      name,
      meta,
      instagram: instagram.replace(/^@/, ""),
      rating,
      text,
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
    else setError(res.message);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Leave a review"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold">Leave a review</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col gap-4 py-2">
            <p className="text-[0.95rem]">
              Thank you! Your review has been sent and will appear on the site once
              we&rsquo;ve approved it.
            </p>
            <button type="button" onClick={onClose} className="self-start rounded-full bg-primary px-6 py-2.5 text-[0.9rem] font-medium text-primary-foreground">
              Close
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <span className="mr-1 text-[0.85rem] text-muted-foreground">Your rating</span>
              {Array.from({ length: 5 }, (_, i) => (
                <button key={i} type="button" onClick={() => setRating(i + 1)} aria-label={`${i + 1} stars`}>
                  <Star className="h-6 w-6" fill={i < rating ? "hsl(var(--star))" : "none"} stroke="hsl(var(--star))" />
                </button>
              ))}
            </div>
            <input className="rounded-lg border border-border bg-background px-3 py-2 text-[0.9rem]" value={name} placeholder="Your name *" onChange={(e) => setName(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded-lg border border-border bg-background px-3 py-2 text-[0.9rem]" value={meta} placeholder="Shoot & city (optional)" onChange={(e) => setMeta(e.target.value)} />
              <input className="rounded-lg border border-border bg-background px-3 py-2 text-[0.9rem]" value={instagram} placeholder="Instagram (optional)" onChange={(e) => setInstagram(e.target.value)} />
            </div>
            <textarea className="rounded-lg border border-border bg-background px-3 py-2 text-[0.9rem]" rows={4} value={text} placeholder="Tell us about your experience *" onChange={(e) => setText(e.target.value)} />

            {/* Honeypot — hidden from people, tempting to bots. */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
            />

            {error ? <p className="text-[0.85rem] text-destructive">{error}</p> : null}

            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.92rem] font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))] disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Sending…" : "Submit review"}
            </button>
            <p className="text-[0.75rem] text-muted-foreground">
              Reviews are checked before they appear on the site.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewForm;
