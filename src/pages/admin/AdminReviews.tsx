import { useEffect, useState } from "react";
import { Check, EyeOff, Loader2, Star, Undo2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchAllReviews,
  setReviewStatus,
  type AdminReview,
} from "@/lib/reviews-api";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<AdminReview["status"], string> = {
  pending: "bg-[hsl(var(--star)/0.15)] text-[hsl(var(--star))]",
  approved: "bg-secondary text-secondary-foreground",
  hidden: "bg-muted text-muted-foreground",
};

const AdminReviews = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => fetchAllReviews().then(setReviews);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAllReviews()
      .then((r) => active && setReviews(r))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const act = async (id: string, status: AdminReview["status"], msg: string) => {
    setBusyId(id);
    const ok = await setReviewStatus(id, status);
    setBusyId(null);
    if (ok) {
      toast.success(msg);
      await load();
    } else {
      toast.error("That didn't work. Please try again.");
    }
  };

  const pending = reviews.filter((r) => r.status === "pending");
  const rest = reviews.filter((r) => r.status !== "pending");

  const Card = ({ r }: { r: AdminReview }) => (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{r.name}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[0.68rem] font-semibold capitalize",
              STATUS_TONE[r.status]
            )}
          >
            {r.status}
          </span>
        </div>
        <div className="flex gap-0.5" aria-label={`${r.rating} of 5`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className="h-3.5 w-3.5"
              aria-hidden="true"
              fill={i < r.rating ? "hsl(var(--star))" : "none"}
              stroke="hsl(var(--star))"
            />
          ))}
        </div>
      </div>
      {r.meta ? <div className="text-[0.78rem] text-muted-foreground">{r.meta}</div> : null}
      {r.text ? (
        <p className="text-[0.9rem] text-[hsl(var(--ink-soft))]">“{r.text}”</p>
      ) : (
        <p className="text-[0.85rem] italic text-muted-foreground">No written comment.</p>
      )}

      <div className="mt-1 flex flex-wrap gap-2">
        {r.status !== "approved" ? (
          <button
            type="button"
            disabled={busyId === r.id}
            onClick={() => act(r.id, "approved", "Review approved — now live on the site.")}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[0.82rem] font-medium text-primary-foreground disabled:opacity-40"
          >
            {busyId === r.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Approve
          </button>
        ) : null}
        {r.status !== "hidden" ? (
          <button
            type="button"
            disabled={busyId === r.id}
            onClick={() => act(r.id, "hidden", "Review hidden.")}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[0.82rem] font-medium hover:border-foreground disabled:opacity-40"
          >
            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
            Hide
          </button>
        ) : null}
        {r.status !== "pending" ? (
          <button
            type="button"
            disabled={busyId === r.id}
            onClick={() => act(r.id, "pending", "Moved back to pending.")}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[0.82rem] font-medium hover:border-foreground disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            Re-queue
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-light tracking-[-0.028em]">Reviews</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Approve reviews to show them on the site. Nothing appears publicly until you do.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading reviews…
        </div>
      ) : reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No reviews yet. Send customers a review link from a delivered booking.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {pending.length ? (
            <section>
              <h2 className="mb-2 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Needs review · {pending.length}
              </h2>
              <div className="flex flex-col gap-3">
                {pending.map((r) => (
                  <Card key={r.id} r={r} />
                ))}
              </div>
            </section>
          ) : null}

          {rest.length ? (
            <section>
              <h2 className="mb-2 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Moderated
              </h2>
              <div className="flex flex-col gap-3">
                {rest.map((r) => (
                  <Card key={r.id} r={r} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
