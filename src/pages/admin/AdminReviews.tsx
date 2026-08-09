import { useEffect, useState } from "react";
import { Check, EyeOff, Loader2, Pencil, Plus, Star, Trash2, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import {
  createAdminReview,
  deleteReview,
  fetchAllReviews,
  setReviewStatus,
  updateReview,
  type AdminReview,
  type ReviewFields,
} from "@/lib/reviews-api";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<AdminReview["status"], string> = {
  pending: "bg-[hsl(var(--star)/0.15)] text-[hsl(var(--star))]",
  approved: "bg-secondary text-secondary-foreground",
  hidden: "bg-muted text-muted-foreground",
};

const blankFields = (): ReviewFields => ({
  name: "",
  meta: "",
  instagram: "",
  rating: 5,
  text: "",
  serviceSlug: "",
});

/** Shared editable form for both adding and editing a review. */
const ReviewEditor = ({
  value,
  onChange,
}: {
  value: ReviewFields;
  onChange: (v: ReviewFields) => void;
}) => {
  const { config } = useSiteConfig();
  const set = (p: Partial<ReviewFields>) => onChange({ ...value, ...p });
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={value.name} placeholder="Name" onChange={(e) => set({ name: e.target.value })} />
        <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={value.meta} placeholder="Context e.g. Wedding · Udaipur" onChange={(e) => set({ meta: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={value.instagram} placeholder="Instagram (optional)" onChange={(e) => set({ instagram: e.target.value })} />
        <select className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={value.serviceSlug} onChange={(e) => set({ serviceSlug: e.target.value })}>
          <option value="">Any service</option>
          {config.categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <span className="mr-1 text-[0.82rem] text-muted-foreground">Rating</span>
        {Array.from({ length: 5 }, (_, i) => (
          <button key={i} type="button" onClick={() => set({ rating: i + 1 })} aria-label={`${i + 1} stars`}>
            <Star className="h-5 w-5" fill={i < value.rating ? "hsl(var(--star))" : "none"} stroke="hsl(var(--star))" />
          </button>
        ))}
      </div>
      <textarea className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" rows={3} value={value.text} placeholder="What they said…" onChange={(e) => set({ text: e.target.value })} />
    </div>
  );
};

const AdminReviews = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [newReview, setNewReview] = useState<ReviewFields>(blankFields);
  const [editId, setEditId] = useState<string | null>(null);
  const [editReview, setEditReview] = useState<ReviewFields>(blankFields);

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

  const saveNew = async () => {
    if (!newReview.name.trim() || !newReview.text.trim()) {
      toast.error("Add a name and the review text.");
      return;
    }
    const ok = await createAdminReview(newReview, "approved");
    if (ok) {
      toast.success("Review added and published.");
      setNewReview(blankFields());
      setAdding(false);
      await load();
    } else {
      toast.error("Couldn't add the review.");
    }
  };

  const saveEdit = async () => {
    if (!editId) return;
    const ok = await updateReview(editId, editReview);
    if (ok) {
      toast.success("Review updated.");
      setEditId(null);
      await load();
    } else {
      toast.error("Couldn't update the review.");
    }
  };

  const remove = async (r: AdminReview) => {
    if (!window.confirm(`Delete this review from ${r.name || "the customer"}? This can't be undone.`)) return;
    const ok = await deleteReview(r.id);
    if (ok) {
      toast.success("Review deleted.");
      setReviews((list) => list.filter((x) => x.id !== r.id));
    } else {
      toast.error("Couldn't delete the review.");
    }
  };

  const startEdit = (r: AdminReview) => {
    setEditId(r.id);
    setEditReview({
      name: r.name,
      meta: r.meta,
      instagram: r.instagram,
      rating: r.rating,
      text: r.text,
      serviceSlug: r.serviceSlug,
    });
  };

  const pending = reviews.filter((r) => r.status === "pending");
  const rest = reviews.filter((r) => r.status !== "pending");

  const Card = ({ r }: { r: AdminReview }) => {
    if (editId === r.id) {
      return (
        <div className="flex flex-col gap-2 rounded-xl border border-primary bg-card p-4">
          <ReviewEditor value={editReview} onChange={setEditReview} />
          <div className="flex gap-2">
            <button type="button" onClick={saveEdit} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[0.82rem] font-medium text-primary-foreground">
              <Check className="h-3.5 w-3.5" /> Save
            </button>
            <button type="button" onClick={() => setEditId(null)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[0.82rem] font-medium hover:border-foreground">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{r.name}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[0.68rem] font-semibold capitalize", STATUS_TONE[r.status])}>
              {r.status}
            </span>
          </div>
          <div className="flex gap-0.5" aria-label={`${r.rating} of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className="h-3.5 w-3.5" aria-hidden="true" fill={i < r.rating ? "hsl(var(--star))" : "none"} stroke="hsl(var(--star))" />
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
            <button type="button" disabled={busyId === r.id} onClick={() => act(r.id, "approved", "Review approved — now live on the site.")} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[0.82rem] font-medium text-primary-foreground disabled:opacity-40">
              {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Approve
            </button>
          ) : null}
          {r.status !== "hidden" ? (
            <button type="button" disabled={busyId === r.id} onClick={() => act(r.id, "hidden", "Review hidden.")} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[0.82rem] font-medium hover:border-foreground disabled:opacity-40">
              <EyeOff className="h-3.5 w-3.5" /> Hide
            </button>
          ) : null}
          {r.status !== "pending" ? (
            <button type="button" disabled={busyId === r.id} onClick={() => act(r.id, "pending", "Moved back to pending.")} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[0.82rem] font-medium hover:border-foreground disabled:opacity-40">
              <Undo2 className="h-3.5 w-3.5" /> Re-queue
            </button>
          ) : null}
          <button type="button" onClick={() => startEdit(r)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[0.82rem] font-medium hover:border-foreground">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button type="button" onClick={() => remove(r)} className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.82rem] font-medium text-destructive hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-light tracking-[-0.028em]">Reviews</h1>
          <p className="text-sm text-muted-foreground">
            Add testimonials yourself, or approve ones customers submit. Nothing shows until approved.
          </p>
        </div>
        {!adding ? (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[0.85rem] font-medium text-primary-foreground">
            <Plus className="h-4 w-4" /> Add review
          </button>
        ) : null}
      </div>

      {adding ? (
        <div className="mb-6 flex flex-col gap-2 rounded-xl border border-primary bg-card p-4">
          <span className="text-[0.82rem] font-semibold">New testimonial</span>
          <ReviewEditor value={newReview} onChange={setNewReview} />
          <div className="flex gap-2">
            <button type="button" onClick={saveNew} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[0.82rem] font-medium text-primary-foreground">
              <Check className="h-3.5 w-3.5" /> Add &amp; publish
            </button>
            <button type="button" onClick={() => { setAdding(false); setNewReview(blankFields()); }} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[0.82rem] font-medium hover:border-foreground">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews…
        </div>
      ) : reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No reviews yet. Add one above, or approve customer submissions as they come in.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {pending.length ? (
            <section>
              <h2 className="mb-2 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Needs review · {pending.length}
              </h2>
              <div className="flex flex-col gap-3">
                {pending.map((r) => (<Card key={r.id} r={r} />))}
              </div>
            </section>
          ) : null}

          {rest.length ? (
            <section>
              <h2 className="mb-2 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Published &amp; hidden
              </h2>
              <div className="flex flex-col gap-3">
                {rest.map((r) => (<Card key={r.id} r={r} />))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
