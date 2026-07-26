import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Download, Loader2, MessageCircle, Phone, Search, X } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import {
  deliverGallery,
  fetchAdminBookings,
  markCashReceived,
  updateBookingStatus,
  STATUS_META,
  type AdminBooking,
} from "@/lib/admin-bookings-api";
import { toast } from "sonner";
import { formatINR, formatLongDate } from "@/lib/booking";
import InvoicePortal from "@/components/booking/InvoicePortal";
import type { InvoiceData } from "@/components/booking/Invoice";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<string, string> = {
  good: "bg-secondary text-secondary-foreground",
  warn: "bg-[hsl(var(--star)/0.15)] text-[hsl(var(--star))]",
  muted: "bg-muted text-muted-foreground",
  bad: "bg-destructive/10 text-destructive",
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, tone: "muted" as const };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold",
        TONE_CLASS[meta.tone]
      )}
    >
      {meta.label}
    </span>
  );
}

/** These count as "live" business; everything else is history or dead. */
const ACTIVE = new Set([
  "confirmed",
  "completed",
  "delivered",
  "reviewed",
  "awaiting_payment",
  "held",
]);

type Filter = "upcoming" | "cash" | "due" | "past" | "leads" | "all";

/** Started but never paid — a lead to follow up rather than a live booking. */
const LEAD_STATUSES = new Set(["awaiting_payment", "held", "expired", "failed"]);

/** A cash reservation waiting for the studio to confirm payment in person. */
function isCashPending(b: AdminBooking): boolean {
  return b.paymentMethod === "cash" && (b.status === "held" || b.status === "awaiting_payment");
}

/**
 * A booking owes money when it's a live shoot that's been paid something but
 * not in full — i.e. an advance was taken and the balance is still outstanding.
 */
function balanceDuePaise(b: AdminBooking): number {
  const live = b.status === "confirmed" || b.status === "completed";
  if (!live || !b.paidPaise) return 0;
  return Math.max(0, b.totalPaise - b.paidPaise);
}

const AdminBookings = () => {
  const { config } = useSiteConfig();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminBooking | null>(null);
  const [acting, setActing] = useState(false);
  const [galleryUrl, setGalleryUrl] = useState("");

  // Clear the gallery input each time a different booking is opened.
  useEffect(() => setGalleryUrl(""), [selected?.id]);

  const reload = () => fetchAdminBookings().then(setBookings);

  /**
   * Deliver the gallery AND open WhatsApp to send the link in one tap.
   * window.open is called synchronously (before any await) so the browser
   * doesn't treat it as a blocked popup.
   */
  const deliverAndSend = (b: AdminBooking, url: string) => {
    const link = url.trim();
    if (!link) return;
    const msg = `Hi ${b.contactName}, your photos from ${config.branding.siteName} are ready! 📸\n\nView & download here: ${link}`;
    window.open(
      `${waLink(b.contactPhone)}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer"
    );
    void doAction(() => deliverGallery(b.id, link), "Gallery delivered and sent.");
  };

  /** Runs an admin action, then refreshes and closes the drawer. */
  const doAction = async (fn: () => Promise<boolean>, okMsg: string) => {
    setActing(true);
    const ok = await fn();
    setActing(false);
    if (ok) {
      toast.success(okMsg);
      await reload();
      setSelected(null);
    } else {
      toast.error("That didn't work. Please try again.");
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAdminBookings()
      .then((data) => active && setBookings(data))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const slotLabel = (id: string) =>
    config.booking.slots.find((s) => s.id === id)?.label ?? id;
  const serviceName = (slug: string) =>
    config.categories.find((c) => c.slug === slug)?.name ?? slug;

  // A short, human-quotable reference derived from the booking's id. Stable and
  // unique per booking without needing a separate order-number column.
  const orderId = (b: AdminBooking) => `DA-${b.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

  /** Rebuild the invoice from the booking plus current config. */
  const invoiceFor = (b: AdminBooking): InvoiceData => {
    const pack = config.packages.items.find((p) => p.id === b.packageRef);
    return {
      invoiceNo: `DA-${b.startsAt.slice(0, 10).replace(/-/g, "")}-${b.packageRef.toUpperCase()}`,
      issuedOn: new Date(b.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      customerName: b.contactName,
      customerPhone: b.contactPhone,
      customerLocation: b.location,
      serviceName: serviceName(b.serviceSlug),
      packageName: pack?.name ?? b.packageRef,
      shootDate: formatLongDate(b.startsAt.slice(0, 10)),
      slotLabel: slotLabel(b.slotId),
      deliverables: pack?.features ?? [],
      totalRupees: b.totalPaise / 100,
      paidRupees: (b.paidPaise ?? 0) / 100,
    };
  };

  const now = Date.now();
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (b: AdminBooking) =>
      !q ||
      b.contactName.toLowerCase().includes(q) ||
      b.contactPhone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
      orderId(b).toLowerCase().includes(q);

    const live = bookings.filter((b) => ACTIVE.has(b.status));
    let list: AdminBooking[];
    if (filter === "all") list = bookings;
    else if (filter === "cash")
      list = bookings
        .filter(isCashPending)
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    else if (filter === "leads")
      list = bookings
        .filter((b) => LEAD_STATUSES.has(b.status))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else if (filter === "due")
      list = live
        .filter((b) => balanceDuePaise(b) > 0)
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    else if (filter === "upcoming")
      // Only shoots still to happen — a delivered or completed job isn't
      // "upcoming" even if its date is in the future (e.g. rescheduled early).
      list = live
        .filter(
          (b) =>
            (b.status === "confirmed" || b.status === "awaiting_payment") &&
            new Date(b.startsAt).getTime() >= now
        )
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    else
      list = live
        .filter((b) => new Date(b.startsAt).getTime() < now)
        .sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));

    return list.filter(matches);
    // orderId is a pure helper; eslint can't see it's stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, filter, now, query]);

  /** Export every booking as CSV — the studio's full record for accounts. */
  const exportCsv = () => {
    const cell = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = [
      "Order ID", "Booked on", "Status", "Customer", "Phone", "Email",
      "Service", "Package", "Shoot date", "Slot", "Location",
      "Total (₹)", "Paid (₹)", "Balance (₹)", "Payment ID", "Notes",
    ];
    const rows = bookings.map((b) => [
      orderId(b),
      new Date(b.createdAt).toLocaleDateString("en-IN"),
      STATUS_META[b.status]?.label ?? b.status,
      b.contactName,
      b.contactPhone,
      b.contactEmail ?? "",
      serviceName(b.serviceSlug),
      config.packages.items.find((p) => p.id === b.packageRef)?.name ?? b.packageRef,
      formatLongDate(b.startsAt.slice(0, 10)),
      slotLabel(b.slotId),
      b.location,
      b.totalPaise / 100,
      (b.paidPaise ?? 0) / 100,
      (b.totalPaise - (b.paidPaise ?? 0)) / 100,
      b.razorpayPaymentId ?? "",
      b.notes,
    ]);
    const csv = [headers, ...rows].map((r) => r.map(cell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `dusk-angle-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const upcomingCount = bookings.filter(
    (b) => ACTIVE.has(b.status) && new Date(b.startsAt).getTime() >= now
  ).length;
  const confirmedRevenue = bookings
    .filter((b) => b.paidPaise)
    .reduce((sum, b) => sum + (b.paidPaise ?? 0), 0);
  // Outstanding balances — the "khata" the studio is still owed.
  const outstanding = bookings.reduce((sum, b) => sum + balanceDuePaise(b), 0);
  const dueCount = bookings.filter((b) => balanceDuePaise(b) > 0).length;

  const waLink = (phone: string) =>
    `https://wa.me/${phone.replace(/\D/g, "")}`;

  /** Prefilled WhatsApp reminder for the outstanding balance. */
  const reminderLink = (b: AdminBooking) => {
    const balance = balanceDuePaise(b);
    const msg = [
      `Hi ${b.contactName}, a friendly reminder from ${config.branding.siteName}.`,
      "",
      `Your ${serviceName(b.serviceSlug)} shoot is on ${formatLongDate(b.startsAt.slice(0, 10))} (${slotLabel(b.slotId)}).`,
      `Balance due: ${formatINR(balance / 100)}, payable on the day of the shoot.`,
      "",
      "See you soon!",
    ].join("\n");
    return `${waLink(b.contactPhone)}?text=${encodeURIComponent(msg)}`;
  };

  /** Prefilled WhatsApp reminder that the shoot is coming up. */
  const shootReminderLink = (b: AdminBooking) => {
    const msg = [
      `Hi ${b.contactName}, looking forward to your ${serviceName(b.serviceSlug)} shoot with ${config.branding.siteName}!`,
      "",
      `Date: ${formatLongDate(b.startsAt.slice(0, 10))}`,
      `Time: ${slotLabel(b.slotId)}`,
      b.location ? `Location: ${b.location}` : "",
      "",
      "Let us know if anything changes. See you then!",
    ]
      .filter(Boolean)
      .join("\n");
    return `${waLink(b.contactPhone)}?text=${encodeURIComponent(msg)}`;
  };

  const isUpcoming = (b: AdminBooking) =>
    (b.status === "confirmed" || b.status === "completed") &&
    new Date(b.startsAt).getTime() >= now;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-2xl font-light tracking-[-0.028em]">Bookings</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Everyone who has booked or started a booking.
      </p>

      {/* summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-2xl font-light tabular-nums">{upcomingCount}</div>
          <div className="text-[0.8rem] text-muted-foreground">Upcoming shoots</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-2xl font-light tabular-nums">
            {formatINR(confirmedRevenue / 100)}
          </div>
          <div className="text-[0.8rem] text-muted-foreground">Collected</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-2xl font-light tabular-nums text-[hsl(var(--star))]">
            {formatINR(outstanding / 100)}
          </div>
          <div className="text-[0.8rem] text-muted-foreground">
            Balance due{dueCount ? ` · ${dueCount}` : ""}
          </div>
        </div>
      </div>

      {/* search + export */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone or order ID"
            className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-3 text-[0.88rem] outline-none focus:border-foreground"
          />
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!bookings.length}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[0.85rem] font-medium transition-colors hover:border-foreground disabled:opacity-40"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </button>
      </div>

      {/* filter */}
      <div className="mb-4 flex gap-1.5">
        {(["upcoming", "cash", "due", "leads", "past", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-[0.85rem] transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:border-foreground"
            )}
          >
            {f === "due"
              ? "Payment due"
              : f === "cash"
                ? "Cash pending"
                : f === "leads"
                  ? "Leads"
                  : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading bookings…
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No {filter === "all" ? "" : filter} bookings yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setSelected(b)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-foreground"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{b.contactName}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="mt-0.5 truncate text-[0.85rem] text-muted-foreground">
                    {serviceName(b.serviceSlug)} · {formatLongDate(
                      b.startsAt.slice(0, 10)
                    )}{" "}
                    · {slotLabel(b.slotId)}
                  </div>
                  <div className="mt-0.5 font-mono text-[0.7rem] text-muted-foreground/70">
                    {orderId(b)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[0.9rem] font-medium tabular-nums">
                    {formatINR(b.totalPaise / 100)}
                  </div>
                  {b.paidPaise ? (
                    <div className="text-[0.75rem] text-[hsl(var(--whatsapp))]">
                      {formatINR(b.paidPaise / 100)} paid
                    </div>
                  ) : (
                    <div className="text-[0.75rem] text-muted-foreground">unpaid</div>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* detail drawer */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="h-full w-full max-w-md overflow-y-auto bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-light tracking-[-0.028em]">
                  {selected.contactName}
                </h2>
                <div className="mt-0.5 flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <span className="font-mono text-[0.72rem] text-muted-foreground">
                    {orderId(selected)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <dl className="flex flex-col divide-y divide-border text-[0.9rem]">
              {[
                ["Service", serviceName(selected.serviceSlug)],
                ["Date", formatLongDate(selected.startsAt.slice(0, 10))],
                ["Time", slotLabel(selected.slotId)],
                ["Location", selected.location || "—"],
                ["Total", formatINR(selected.totalPaise / 100)],
                [
                  "Paid",
                  selected.paidPaise
                    ? `${formatINR(selected.paidPaise / 100)} (${selected.payMode})`
                    : "Not paid",
                ],
                [
                  "Balance",
                  selected.paidPaise
                    ? formatINR((selected.totalPaise - selected.paidPaise) / 100)
                    : formatINR(selected.totalPaise / 100),
                ],
                ["Payment ID", selected.razorpayPaymentId || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            {selected.notes ? (
              <div className="mt-4 rounded-lg bg-muted p-3 text-[0.85rem] text-[hsl(var(--ink-soft))]">
                “{selected.notes}”
              </div>
            ) : null}

            {balanceDuePaise(selected) > 0 ? (
              <a
                href={reminderLink(selected)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center justify-between gap-2 rounded-xl border border-[hsl(var(--star)/0.4)] bg-[hsl(var(--star)/0.08)] px-4 py-3 text-[0.9rem]"
              >
                <span>
                  <strong>{formatINR(balanceDuePaise(selected) / 100)}</strong> still due
                  <span className="block text-[0.75rem] text-muted-foreground">
                    Tap to send a WhatsApp reminder
                  </span>
                </span>
                <MessageCircle className="h-5 w-5 text-[hsl(var(--star))]" aria-hidden="true" />
              </a>
            ) : null}

            <div className="mt-4 flex flex-col gap-2">
              <a
                href={waLink(selected.contactPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.92rem] font-medium text-primary-foreground"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp {selected.contactPhone}
              </a>
              <a
                href={`tel:${selected.contactPhone.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-[0.92rem] font-medium"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call
              </a>
              {/* Invoice is meaningful only once money has been taken. */}
              {selected.paidPaise ? <InvoicePortal data={invoiceFor(selected)} /> : null}
              {/* Remind the customer their shoot is coming up. */}
              {isUpcoming(selected) ? (
                <a
                  href={shootReminderLink(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-[0.92rem] font-medium"
                >
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                  Send shoot reminder
                </a>
              ) : null}
            </div>

            {/* ---- gallery delivery (once the shoot is done) ---- */}
            {(selected.status === "confirmed" ||
              selected.status === "completed" ||
              selected.status === "delivered") ? (
              <div className="mt-6 border-t border-border pt-4">
                <h3 className="mb-2 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Gallery
                </h3>
                {selected.galleryUrl ? (
                  <div className="flex flex-col gap-2">
                    <a
                      href={selected.galleryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-[0.88rem] text-primary underline"
                    >
                      {selected.galleryUrl}
                    </a>
                    <a
                      href={`${waLink(selected.contactPhone)}?text=${encodeURIComponent(
                        `Hi ${selected.contactName}, your photos from ${config.branding.siteName} are ready! 📸\n\nView & download here: ${selected.galleryUrl}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-[0.85rem] font-medium text-primary-foreground"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Send gallery on WhatsApp
                    </a>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={galleryUrl}
                      onChange={(e) => setGalleryUrl(e.target.value)}
                      placeholder="Paste gallery link (Drive, etc.)"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[0.85rem] outline-none focus:border-foreground"
                    />
                    <button
                      type="button"
                      disabled={acting || !galleryUrl.trim()}
                      onClick={() => deliverAndSend(selected, galleryUrl)}
                      className="rounded-full bg-primary px-4 py-2 text-[0.85rem] font-medium text-primary-foreground disabled:opacity-40"
                    >
                      Deliver &amp; send
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {/* ---- cash payment confirmation ---- */}
            {isCashPending(selected) ? (
              <div className="mt-6 rounded-xl border border-[hsl(var(--star)/0.4)] bg-[hsl(var(--star)/0.08)] p-4">
                <h3 className="mb-1 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--star))]">
                  Cash reservation
                </h3>
                <p className="mb-3 text-[0.85rem] text-[hsl(var(--ink-soft))]">
                  Awaiting cash. Confirm once received — this locks the date and marks it
                  paid.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() =>
                      doAction(
                        () =>
                          markCashReceived(
                            selected.id,
                            Math.round(
                              (selected.totalPaise * config.booking.advancePercent) / 100
                            ),
                            "advance"
                          ),
                        "Advance recorded — booking confirmed."
                      )
                    }
                    className="rounded-full border border-border bg-card px-4 py-2 text-[0.85rem] font-medium hover:border-foreground disabled:opacity-40"
                  >
                    Got advance (
                    {formatINR(
                      (selected.totalPaise * config.booking.advancePercent) / 100 / 100
                    )}
                    )
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() =>
                      doAction(
                        () => markCashReceived(selected.id, selected.totalPaise, "balance"),
                        "Full payment recorded — booking confirmed."
                      )
                    }
                    className="rounded-full bg-primary px-4 py-2 text-[0.85rem] font-medium text-primary-foreground disabled:opacity-40"
                  >
                    Got full ({formatINR(selected.totalPaise / 100)})
                  </button>
                </div>
              </div>
            ) : null}

            {/* ---- status actions ---- */}
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="mb-2 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Update status
              </h3>
              <div className="flex flex-wrap gap-2">
                {selected.status === "confirmed" ? (
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() =>
                      doAction(
                        () => updateBookingStatus(selected.id, "completed"),
                        "Marked completed."
                      )
                    }
                    className="rounded-full border border-border px-4 py-2 text-[0.85rem] font-medium hover:border-foreground disabled:opacity-40"
                  >
                    Mark completed
                  </button>
                ) : null}

                {selected.status === "delivered" && selected.reviewStatus == null ? (
                  <a
                    href={`${window.location.origin}/review/${selected.id}?n=${encodeURIComponent(
                      selected.contactName
                    )}&s=${encodeURIComponent(
                      `${serviceName(selected.serviceSlug)} · ${selected.location}`
                    )}`}
                    onClick={(e) => {
                      // Copy the link so the studio can paste it into WhatsApp.
                      e.preventDefault();
                      navigator.clipboard?.writeText(e.currentTarget.href);
                      toast.success("Review link copied — paste it to the customer.");
                    }}
                    className="rounded-full border border-border px-4 py-2 text-[0.85rem] font-medium hover:border-foreground"
                  >
                    Copy review link
                  </a>
                ) : null}

                {selected.status !== "cancelled" &&
                selected.status !== "refunded" ? (
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Cancel this booking? The date will be freed for others."
                        )
                      ) {
                        void doAction(
                          () => updateBookingStatus(selected.id, "cancelled"),
                          "Booking cancelled."
                        );
                      }
                    }}
                    className="rounded-full border border-destructive/40 px-4 py-2 text-[0.85rem] font-medium text-destructive hover:border-destructive disabled:opacity-40"
                  >
                    Cancel booking
                  </button>
                ) : null}
              </div>
              <p className="mt-3 text-[0.75rem] text-muted-foreground">
                Rescheduling: cancel and rebook the new date for now — in-place
                reschedule is coming next.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminBookings;
