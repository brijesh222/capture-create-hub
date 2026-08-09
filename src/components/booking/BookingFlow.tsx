import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Loader2, Lock, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getWhatsAppLink, normalisePhone } from "@/lib/site-config-utils";
import {
  advanceAmount,
  balanceAmount,
  formatINR,
  formatLongDate,
  parsePrice,
} from "@/lib/booking";
import BookingCalendar from "./BookingCalendar";
import InvoicePortal from "./InvoicePortal";
import type { InvoiceData } from "./Invoice";
import { createBooking, fetchBusySlots, type BusySlot } from "@/lib/bookings-api";
import { isPaymentEnabled, startPayment } from "@/lib/payments";
import { cn } from "@/lib/utils";
import type { PackageItem } from "@/types/site-config";

export interface BookingStart {
  serviceSlug?: string;
  packageId?: string;
}

type Step = 1 | 2 | 3 | 4 | "done";

const STEP_LABELS: Record<number, string> = {
  1: "Package",
  2: "Date",
  3: "Details",
  4: "Confirm",
};

const BookingFlow = ({
  open,
  onOpenChange,
  start,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  start?: BookingStart;
}) => {
  const { config } = useSiteConfig();
  const booking = config.booking;

  const [step, setStep] = useState<Step>(1);
  const [serviceSlug, setServiceSlug] = useState("");
  const [packageId, setPackageId] = useState("");
  const [date, setDate] = useState("");
  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [slotId, setSlotId] = useState("");
  const [details, setDetails] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    notes: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [payMode, setPayMode] = useState<"advance" | "full">("advance");
  // "cash" reserves the date and the studio confirms on payment in person.
  const [payChannel, setPayChannel] = useState<"online" | "cash">("online");
  const [sentLink, setSentLink] = useState<string | null>(null);
  // null means availability could not be checked — distinct from "nothing booked".
  const [busy, setBusy] = useState<BusySlot[] | null>([]);
  const [loadingBusy, setLoadingBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const services = config.categories.filter((c) => c.visible !== false);

  const packagesForService = useMemo(() => {
    const forService = config.packages.items.filter((p) => p.serviceSlug === serviceSlug);
    return forService.length
      ? forService
      : config.packages.items.filter((p) => !p.serviceSlug);
  }, [config.packages.items, serviceSlug]);

  const pack: PackageItem | undefined = config.packages.items.find(
    (p) => p.id === packageId
  );
  const total = parsePrice(pack?.price ?? "");
  const advance = advanceAmount(pack, booking.advancePercent);
  const balance = balanceAmount(pack, booking.advancePercent);
  // When the studio turns slots off, a single-day booking is a whole-day
  // booking — no time picker, mirroring how a multi-day range already works.
  const slotsOn = config.booking.slotsEnabled !== false;
  const effectiveSlotId = dateMode === "single" && !slotsOn ? "fullday" : slotId;
  const slot = booking.slots.find((s) => s.id === effectiveSlotId);

  // Single-day uses one date (+ a slot when slots are on); range uses start..end.
  const bookingDay = dateMode === "single" ? date : rangeStart;
  const bookingEndDay = dateMode === "single" ? "" : rangeEnd;
  const dateChosen =
    dateMode === "single"
      ? Boolean(date && (!slotsOn || slotId))
      : Boolean(rangeStart && rangeEnd);

  // Human-readable date/time used across the summary, message and receipt.
  const dateDisplay =
    dateMode === "range"
      ? rangeStart && rangeEnd
        ? `${formatLongDate(rangeStart)} → ${formatLongDate(rangeEnd)}`
        : ""
      : date
        ? formatLongDate(date)
        : "";
  const timeDisplay =
    dateMode === "range" ? "Full days" : slot?.label ?? (slotsOn ? "" : "Full day");

  /* Reset whenever the dialog opens, honouring whatever the customer clicked. */
  useEffect(() => {
    if (!open) return;
    const slug = start?.serviceSlug ?? "";
    const pid = start?.packageId ?? "";
    setServiceSlug(slug);
    setPackageId(pid);
    setDate("");
    setDateMode("single");
    setRangeStart("");
    setRangeEnd("");
    setSlotId("");
    setDetails({ name: "", phone: "", email: "", location: "", notes: "" });
    setAgreed(false);
    setPayMode("advance");
    setPayChannel("online");
    setSentLink(null);
    setSubmitError("");
    // Arriving from a package card means step 1 is already answered.
    setStep(pid ? 2 : 1);
  }, [open, start?.serviceSlug, start?.packageId]);

  /* Real availability, loaded when the flow opens. */
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingBusy(true);
    fetchBusySlots()
      .then((slots) => {
        if (active) setBusy(slots);
      })
      .finally(() => {
        if (active) setLoadingBusy(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  /** Slot ids booked on the chosen day. */
  const bookedSlotIds = useMemo(
    () => new Set((busy ?? []).filter((b) => b.day === date).map((b) => b.slotId)),
    [busy, date]
  );

  /**
   * A slot is unavailable when its hours overlap anything already booked, not
   * merely when the same slot id is taken. "Full day" spans 8am–7pm, so a
   * booked morning rules it out even though the ids differ — and the database
   * would reject it anyway, after the customer had filled in the whole form.
   */
  const takenSlotIds = useMemo(() => {
    // Defensive: a slot from an older saved config may have no times at all.
    const toMin = (t: string | undefined, fallback: number) => {
      if (!t) return fallback;
      const [h, m] = t.split(":").map(Number);
      return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : fallback;
    };
    const bookedRanges = booking.slots
      .filter((s) => bookedSlotIds.has(s.id))
      .map((s) => [toMin(s.start, 0), toMin(s.end, 24 * 60)] as const);

    const unavailable = new Set<string>();
    booking.slots.forEach((s) => {
      const [start, end] = [toMin(s.start, 0), toMin(s.end, 24 * 60)];
      if (bookedRanges.some(([bs, be]) => start < be && bs < end)) {
        unavailable.add(s.id);
      }
    });
    return unavailable;
  }, [booking.slots, bookedSlotIds]);

  /** True when the availability check failed, so the calendar can't be trusted. */
  const availabilityUnknown = busy === null;

  /** Days where every slot is gone, so the calendar can grey them out. */
  const fullDays = useMemo(() => {
    const byDay = new Map<string, Set<string>>();
    (busy ?? []).forEach((b) => {
      if (!byDay.has(b.day)) byDay.set(b.day, new Set());
      byDay.get(b.day)!.add(b.slotId);
    });
    const full = new Set<string>();
    byDay.forEach((slots, day) => {
      // A booked "full day" takes everything; otherwise every slot must be gone.
      if (slots.has("fullday") || booking.slots.every((s) => slots.has(s.id))) {
        full.add(day);
      }
    });
    return full;
  }, [busy, booking.slots]);

  const payAndBook = async () => {
    if (!pack) return;
    setSubmitting(true);
    setSubmitError("");

    const outcome = await startPayment({
      serviceSlug,
      packageRef: pack.id,
      day: bookingDay,
      endDay: bookingEndDay,
      slotId: effectiveSlotId,
      payMode,
      name: details.name,
      phone: details.phone,
      email: details.email,
      location: details.location,
      notes: details.notes,
      brandName: config.branding.siteName,
      description: `${pack.name} · ${timeDisplay}`,
    });

    setSubmitting(false);

    if (outcome.status === "paid") {
      setSentLink(null);
      setStep("done");
      return;
    }
    if (outcome.status === "taken") {
      setSlotId("");
      setSubmitError(outcome.message);
      void fetchBusySlots().then(setBusy);
      setStep(2);
      return;
    }
    if (outcome.status === "error") setSubmitError(outcome.message);
    // "dismissed" means they closed the window — leave the form as it was so
    // they can simply try again.
  };

  const submit = async () => {
    if (!pack) return;
    setSubmitting(true);
    setSubmitError("");

    // Save first. If the slot was taken in the meantime the database rejects
    // it, and the customer must not be shown a success message.
    const saved = await createBooking({
      serviceSlug,
      serviceName: services.find((s) => s.slug === serviceSlug)?.name ?? "",
      pack,
      day: bookingDay,
      endDay: bookingEndDay,
      slotId: dateMode === "range" ? "fullday" : effectiveSlotId,
      slotLabel: dateMode === "range" ? "Full days" : timeDisplay,
      slotStart: slot?.start ?? "08:00",
      slotEnd: slot?.end ?? "19:00",
      name: details.name,
      phone: details.phone,
      email: details.email,
      location: details.location,
      notes: details.notes,
      payMode,
      advancePercent: booking.advancePercent,
      method: payChannel,
    });

    setSubmitting(false);

    if (!saved.ok) {
      if (saved.reason === "taken") {
        // Send them back to pick again, with fresh availability.
        setSlotId("");
        setSubmitError(saved.message);
        void fetchBusySlots().then(setBusy);
        setStep(2);
        return;
      }
      // Storage isn't reachable. The booking still reaches the studio by
      // WhatsApp, so let it through rather than losing the customer.
      if (saved.reason !== "offline") {
        setSubmitError(saved.message);
        return;
      }
    }

    const lines = [
      "*New Booking Request*",
      "",
      `Service: ${services.find((s) => s.slug === serviceSlug)?.name ?? "—"}`,
      `Package: ${pack ? `${pack.name} (${pack.price})` : "—"}`,
      `Date: ${dateDisplay || "—"}`,
      `Time: ${timeDisplay || "—"}`,
      "",
      `Name: ${details.name}`,
      `Phone: ${details.phone}`,
      details.email ? `Email: ${details.email}` : "",
      `Location: ${details.location}`,
      details.notes ? `Notes: ${details.notes}` : "",
      "",
      payMode === "advance"
        ? `Paying now: ${formatINR(advance)} advance (${booking.advancePercent}%)`
        : `Paying now: ${formatINR(total)} in full`,
      payMode === "advance" ? `Balance on shoot day: ${formatINR(balance)}` : "",
    ].filter(Boolean);

    const number = normalisePhone(config.contact.whatsappNumber);
    const url = `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSentLink(url);
    setStep("done");
  };

  const canContinue =
    step === 1
      ? Boolean(packageId)
      : step === 2
        // Never let someone pick a date when we don't know what's actually free.
        ? Boolean(dateChosen && !availabilityUnknown)
        : step === 3
          ? Boolean(details.name.trim() && details.phone.trim() && details.location.trim() && agreed)
          : true;

  const summary = (
    <aside className="self-start rounded-xl border border-border bg-muted/40 p-4">
      <h3 className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Your booking
      </h3>
      <dl className="flex flex-col gap-1 text-[0.88rem]">
        {pack ? (
          <div className="flex justify-between gap-3 py-0.5">
            <dt className="text-muted-foreground">Package</dt>
            <dd className="text-right font-medium">{pack.name}</dd>
          </div>
        ) : null}
        {dateDisplay ? (
          <div className="flex justify-between gap-3 py-0.5">
            <dt className="text-muted-foreground">Date</dt>
            <dd className="text-right font-medium">{dateDisplay}</dd>
          </div>
        ) : null}
        {timeDisplay ? (
          <div className="flex justify-between gap-3 py-0.5">
            <dt className="text-muted-foreground">Time</dt>
            <dd className="text-right font-medium">{timeDisplay}</dd>
          </div>
        ) : null}
        {pack ? (
          <div className="mt-2 flex justify-between gap-3 border-t border-border pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatINR(total)}</dd>
          </div>
        ) : null}
        {pack && step >= 3 ? (
          <div className="flex justify-between gap-3 text-[0.82rem] text-muted-foreground">
            <dt>Advance ({booking.advancePercent}%)</dt>
            <dd className="tabular-nums">{formatINR(advance)}</dd>
          </div>
        ) : null}
      </dl>
    </aside>
  );

  /** Everything the invoice needs, from state already gathered in the flow. */
  const invoiceData: InvoiceData | null = pack
    ? {
        // Interim reference until invoices are numbered in the database.
        invoiceNo: `DA-${date.replace(/-/g, "")}-${pack.id.toUpperCase()}`,
        issuedOn: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        customerName: details.name,
        customerPhone: details.phone,
        customerLocation: details.location,
        serviceName: services.find((s) => s.slug === serviceSlug)?.name ?? "",
        packageName: pack.name,
        shootDate: dateDisplay,
        slotLabel: timeDisplay,
        deliverables: pack.features,
        totalRupees: total,
        paidRupees: payMode === "full" ? total : advance,
      }
    : null;

  /* ------------------------------------------------------------------ done */
  if (step === "done") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Check className="h-7 w-7 text-primary" aria-hidden="true" />
            </span>
            <DialogTitle className="text-xl font-light tracking-[-0.028em]">
              {sentLink ? "Booking requested" : "Booking confirmed"}
            </DialogTitle>
            <p className="max-w-[24rem] text-[0.93rem] text-[hsl(var(--ink-soft))]">
              {sentLink
                ? booking.confirmationText
                : "Your date is locked in. We've emailed your receipt, and Brijesh will message you on WhatsApp to plan the details."}
            </p>

            <div className="mt-1 w-full rounded-xl border border-border p-4 text-left">
              <dl className="flex flex-col gap-1 text-[0.88rem]">
                <div className="flex justify-between gap-3 py-0.5">
                  <dt className="text-muted-foreground">Package</dt>
                  <dd className="text-right font-medium">{pack?.name}</dd>
                </div>
                <div className="flex justify-between gap-3 py-0.5">
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="text-right font-medium">
                    {dateDisplay || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 py-0.5">
                  <dt className="text-muted-foreground">Time</dt>
                  <dd className="text-right font-medium">{timeDisplay}</dd>
                </div>
                <div className="mt-1.5 flex justify-between gap-3 border-t border-border pt-2">
                  <dt className="text-muted-foreground">
                    {payMode === "advance" ? "Advance due" : "Total due"}
                  </dt>
                  <dd className="tabular-nums font-semibold">
                    {formatINR(payMode === "advance" ? advance : total)}
                  </dd>
                </div>
                {payMode === "advance" ? (
                  <div className="flex justify-between gap-3 text-[0.82rem] text-muted-foreground">
                    <dt>Balance on shoot day</dt>
                    <dd className="tabular-nums">{formatINR(balance)}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="mt-1 flex w-full flex-col gap-2">
              {sentLink ? (
                <a
                  href={sentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.92rem] font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Open WhatsApp again
                </a>
              ) : null}
              {/* Only a paid booking has an invoice; an unpaid request has
                  nothing to invoice yet. */}
              {!sentLink && invoiceData ? <InvoicePortal data={invoiceData} /> : null}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex w-full items-center justify-center rounded-full border border-border px-6 py-3 text-[0.92rem] font-medium transition-colors hover:border-foreground"
              >
                Done
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  /* ----------------------------------------------------------------- steps */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-card p-0 sm:max-w-3xl">
        <div className="flex gap-1 px-6 pt-6">
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              className={cn(
                "h-[3px] flex-1 rounded-sm",
                n <= (step as number) ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>
        <p className="px-6 pt-2 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Step {step} of 4 · {STEP_LABELS[step as number]}
        </p>

        <div className="grid gap-6 p-6 md:grid-cols-[1.35fr_0.65fr]">
          <div>
            {/* ------------------------------- 1 · package */}
            {step === 1 ? (
              <>
                <DialogTitle className="mb-1 text-[1.15rem] font-semibold tracking-[-0.02em]">
                  What would you like photographed?
                </DialogTitle>
                <p className="mb-4 text-[0.88rem] text-muted-foreground">
                  Pick a service, then a package.
                </p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setServiceSlug(s.slug);
                        setPackageId("");
                      }}
                      className={cn(
                        "rounded-full border px-4 py-2 text-[0.85rem] transition-colors",
                        serviceSlug === s.slug
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:border-foreground"
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>

                {serviceSlug ? (
                  <div className="flex flex-col gap-2">
                    {packagesForService.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPackageId(p.id)}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                          packageId === p.id
                            ? "border-primary bg-secondary"
                            : "border-border hover:border-foreground"
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border",
                            packageId === p.id ? "border-primary" : "border-muted-foreground/40"
                          )}
                        >
                          {packageId === p.id ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                          ) : null}
                        </span>
                        <span className="flex-1">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="font-semibold">{p.name}</span>
                            <span className="font-semibold tabular-nums">{p.price}</span>
                          </span>
                          <span className="block text-[0.82rem] text-muted-foreground">
                            {p.priceNote}
                          </span>
                          <span className="mt-1 block text-[0.82rem] text-[hsl(var(--ink-soft))]">
                            {p.features.slice(0, 3).join(" · ")}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[0.88rem] text-muted-foreground">
                    Choose a service above to see its packages.
                  </p>
                )}
              </>
            ) : null}

            {/* ------------------------------- 2 · date */}
            {step === 2 ? (
              <>
                <DialogTitle className="mb-1 text-[1.15rem] font-semibold tracking-[-0.02em]">
                  When would you like the shoot?
                </DialogTitle>
                <p className="mb-3 text-[0.88rem] text-muted-foreground">
                  Unavailable dates are greyed out.
                </p>

                {/* One day, or a multi-day event like a wedding. */}
                <div className="mb-3 flex gap-1.5">
                  {(["single", "range"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setDateMode(m);
                        setDate("");
                        setSlotId("");
                        setRangeStart("");
                        setRangeEnd("");
                      }}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-[0.82rem] font-medium transition-colors",
                        dateMode === m
                          ? "bg-primary text-primary-foreground"
                          : "border border-border hover:border-foreground"
                      )}
                    >
                      {m === "single" ? "Single day" : "Multiple days"}
                    </button>
                  ))}
                </div>

                <BookingCalendar
                  mode={dateMode}
                  selected={date}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  fullDays={fullDays}
                  onSelect={(iso) => {
                    setDate(iso);
                    setSlotId("");
                  }}
                  onRangeSelect={(a, b) => {
                    setRangeStart(a);
                    setRangeEnd(b);
                  }}
                />

                {dateMode === "range" && rangeStart ? (
                  <p className="mt-3 text-[0.85rem] text-muted-foreground">
                    {rangeEnd
                      ? `${formatLongDate(rangeStart)} → ${formatLongDate(rangeEnd)}`
                      : `${formatLongDate(rangeStart)} → now pick the last day`}
                  </p>
                ) : null}

                {dateMode === "single" && date && slotsOn ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {booking.slots.map((s) => {
                      const taken = takenSlotIds.has(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={taken}
                          onClick={() => setSlotId(s.id)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-[0.85rem] transition-colors",
                            taken
                              ? "cursor-not-allowed border-border text-muted-foreground/50 line-through"
                              : slotId === s.id
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card hover:border-foreground"
                          )}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {dateMode === "single" && date && !slotsOn ? (
                  <p className="mt-4 text-[0.85rem] text-muted-foreground">
                    This books the <strong className="font-medium text-foreground">whole day</strong> for your shoot.
                  </p>
                ) : null}

                {loadingBusy ? (
                  <p className="mt-3 flex items-center gap-2 text-[0.84rem] text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    Checking availability…
                  </p>
                ) : null}

                {availabilityUnknown && !loadingBusy ? (
                  <p className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 px-3.5 py-3 text-[0.85rem] text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    We couldn&rsquo;t check which dates are free. Please reload, or
                    message us on WhatsApp and we&rsquo;ll confirm availability.
                  </p>
                ) : null}

                {dateChosen && !availabilityUnknown ? (
                  <p className="mt-4 rounded-lg bg-secondary px-3.5 py-3 text-[0.84rem] text-secondary-foreground">
                    Your date is reserved once you submit — we&rsquo;ll confirm it
                    within 48 hours.
                  </p>
                ) : null}

              </>
            ) : null}

            {/* ------------------------------- 3 · details */}
            {step === 3 ? (
              <>
                <DialogTitle className="mb-1 text-[1.15rem] font-semibold tracking-[-0.02em]">
                  Your details
                </DialogTitle>
                <p className="mb-4 text-[0.88rem] text-muted-foreground">
                  We&rsquo;ll confirm everything on WhatsApp.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="bk-name">Full name *</Label>
                    <Input
                      id="bk-name"
                      value={details.name}
                      onChange={(e) => setDetails({ ...details, name: e.target.value })}
                      placeholder="Your name"
                      className="mt-1 bg-background"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bk-phone">Phone (WhatsApp) *</Label>
                    <Input
                      id="bk-phone"
                      type="tel"
                      value={details.phone}
                      onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                      className="mt-1 bg-background"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <Label htmlFor="bk-email">Email — for your invoice</Label>
                  <Input
                    id="bk-email"
                    type="email"
                    value={details.email}
                    onChange={(e) => setDetails({ ...details, email: e.target.value })}
                    placeholder="you@example.com"
                    className="mt-1 bg-background"
                  />
                </div>

                <div className="mt-3">
                  <Label htmlFor="bk-loc">Shoot location *</Label>
                  <Input
                    id="bk-loc"
                    value={details.location}
                    onChange={(e) => setDetails({ ...details, location: e.target.value })}
                    placeholder="City, or venue if you know it"
                    className="mt-1 bg-background"
                  />
                </div>

                <div className="mt-3">
                  <Label htmlFor="bk-notes">
                    Anything we should know?{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="bk-notes"
                    rows={3}
                    value={details.notes}
                    onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                    placeholder="Tell us about the shoot..."
                    className="mt-1 bg-background"
                  />
                </div>

                <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[0.85rem] text-[hsl(var(--ink-soft))]">
                  <Checkbox
                    checked={agreed}
                    onCheckedChange={(v) => setAgreed(v === true)}
                    className="mt-0.5"
                  />
                  <span>{booking.termsText}</span>
                </label>
              </>
            ) : null}

            {/* ------------------------------- 4 · confirm */}
            {step === 4 ? (
              <>
                <DialogTitle className="mb-1 text-[1.15rem] font-semibold tracking-[-0.02em]">
                  How would you like to pay?
                </DialogTitle>
                <p className="mb-4 text-[0.88rem] text-muted-foreground">
                  Pay online to confirm instantly, or reserve now and pay in cash.
                </p>

                {/* Online vs cash. Online confirms via Razorpay; cash reserves
                    the date and the studio confirms when paid in person. */}
                {isPaymentEnabled() ? (
                  <div className="mb-3 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPayChannel("online")}
                      className={cn(
                        "flex-1 rounded-full px-4 py-2 text-[0.85rem] font-medium transition-colors",
                        payChannel === "online"
                          ? "bg-primary text-primary-foreground"
                          : "border border-border hover:border-foreground"
                      )}
                    >
                      Pay online
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayChannel("cash")}
                      className={cn(
                        "flex-1 rounded-full px-4 py-2 text-[0.85rem] font-medium transition-colors",
                        payChannel === "cash"
                          ? "bg-primary text-primary-foreground"
                          : "border border-border hover:border-foreground"
                      )}
                    >
                      Pay cash
                    </button>
                  </div>
                ) : null}

                {payChannel === "cash" ? (
                  <div className="rounded-xl border border-border bg-muted/40 p-4 text-[0.9rem] text-[hsl(var(--ink-soft))]">
                    <p className="font-medium text-foreground">Reserve now, pay in person</p>
                    <p className="mt-1">
                      We&rsquo;ll hold {dateDisplay || "your date"} and
                      confirm once we&rsquo;ve received your payment. We&rsquo;ll message
                      you on WhatsApp to arrange it.
                    </p>
                  </div>
                ) : null}

                <div
                  className={cn(
                    "flex flex-col gap-2",
                    payChannel === "cash" && "hidden"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setPayMode("advance")}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                      payMode === "advance"
                        ? "border-primary bg-secondary"
                        : "border-border hover:border-foreground"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border",
                        payMode === "advance" ? "border-primary" : "border-muted-foreground/40"
                      )}
                    >
                      {payMode === "advance" ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      ) : null}
                    </span>
                    <span className="flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold">Pay advance</span>
                        <span className="font-semibold tabular-nums">{formatINR(advance)}</span>
                      </span>
                      <span className="block text-[0.82rem] text-muted-foreground">
                        {booking.advancePercent}% to lock the date
                      </span>
                      <span className="mt-1 block text-[0.82rem] text-[hsl(var(--ink-soft))]">
                        Balance of {formatINR(balance)} due on the day of the shoot
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMode("full")}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                      payMode === "full"
                        ? "border-primary bg-secondary"
                        : "border-border hover:border-foreground"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border",
                        payMode === "full" ? "border-primary" : "border-muted-foreground/40"
                      )}
                    >
                      {payMode === "full" ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      ) : null}
                    </span>
                    <span className="flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold">Pay in full</span>
                        <span className="font-semibold tabular-nums">{formatINR(total)}</span>
                      </span>
                      <span className="block text-[0.82rem] text-muted-foreground">
                        Nothing left to pay later
                      </span>
                    </span>
                  </button>
                </div>

                {payChannel === "online" ? (
                  <p className="mt-4 flex items-start gap-2 rounded-lg bg-muted px-3.5 py-3 text-[0.84rem] text-muted-foreground">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {isPaymentEnabled()
                        ? "Payment is handled by Razorpay. We never see your card details."
                        : "Online payment isn't live yet. Send the WhatsApp message and Brijesh will confirm your date and share payment details."}
                    </span>
                  </p>
                ) : null}
              </>
            ) : null}

            {submitError ? (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 px-3.5 py-3 text-[0.85rem] text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {submitError}
              </p>
            ) : null}

            {/* ------------------------------- nav */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(((step as number) - 1) as Step)}
                  className="inline-flex items-center rounded-full border border-border px-6 py-3 text-[0.92rem] font-medium transition-colors hover:border-foreground"
                >
                  Back
                </button>
              ) : null}
              <button
                type="button"
                disabled={!canContinue || submitting}
                onClick={() =>
                  step === 4
                    ? // Cash reservations never touch Razorpay — they save and
                      // wait for the studio to confirm payment in person.
                      void (isPaymentEnabled() && payChannel === "online"
                        ? payAndBook()
                        : submit())
                    : setStep(((step as number) + 1) as Step)
                }
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.92rem] font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))] disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : step === 4 ? (
                  payChannel === "cash"
                    ? "Reserve my date"
                    : isPaymentEnabled()
                      ? `Pay ${formatINR(payMode === "advance" ? advance : total)}`
                      : "Send booking request"
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </div>

          {summary}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingFlow;
