import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle, Phone, X } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import {
  fetchAdminBookings,
  STATUS_META,
  type AdminBooking,
} from "@/lib/admin-bookings-api";
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

type Filter = "upcoming" | "due" | "past" | "all";

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
  const [selected, setSelected] = useState<AdminBooking | null>(null);

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
    const live = bookings.filter((b) => ACTIVE.has(b.status));
    if (filter === "all") return bookings;
    if (filter === "due")
      return live
        .filter((b) => balanceDuePaise(b) > 0)
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    if (filter === "upcoming")
      return live
        .filter((b) => new Date(b.startsAt).getTime() >= now)
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    return live
      .filter((b) => new Date(b.startsAt).getTime() < now)
      .sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));
  }, [bookings, filter, now]);

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

      {/* filter */}
      <div className="mb-4 flex gap-1.5">
        {(["upcoming", "due", "past", "all"] as Filter[]).map((f) => (
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
            {f === "due" ? "Payment due" : f.charAt(0).toUpperCase() + f.slice(1)}
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
                <StatusBadge status={selected.status} />
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
            </div>

            <p className="mt-4 text-center text-[0.75rem] text-muted-foreground">
              Confirm, reschedule and cancel are coming next.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminBookings;
