import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { createAdminBooking } from "@/lib/admin-bookings-api";
import { parsePrice, formatLongDate } from "@/lib/booking";
import BookingCalendar from "@/components/booking/BookingCalendar";
import { cn } from "@/lib/utils";

/**
 * Admin-only booking creation, for offline bookings the studio takes by phone
 * or in person. Gives full control the public flow doesn't: any status, cash
 * already taken, and multi-day date ranges.
 */
const AdminBookingForm = ({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) => {
  const { config } = useSiteConfig();
  const services = config.categories.filter((c) => c.visible !== false);

  const [serviceSlug, setServiceSlug] = useState(services[0]?.slug ?? "");
  const [packageRef, setPackageRef] = useState("");
  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [day, setDay] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [slotId, setSlotId] = useState(config.booking.slots[0]?.id ?? "");
  const [form, setForm] = useState({ name: "", phone: "", email: "", location: "", notes: "" });
  const [status, setStatus] = useState("confirmed");
  const [cashKind, setCashKind] = useState<"none" | "advance" | "full">("advance");
  const [busy, setBusy] = useState(false);

  const packagesForService = useMemo(
    () => config.packages.items.filter((p) => p.serviceSlug === serviceSlug),
    [config.packages.items, serviceSlug]
  );
  const pack = config.packages.items.find((p) => p.id === packageRef);
  const slot = config.booking.slots.find((s) => s.id === slotId);

  const dateOk = dateMode === "single" ? Boolean(day) : Boolean(rangeStart && rangeEnd);
  const canSave =
    form.name.trim() && form.phone.trim() && packageRef && dateOk && !busy;

  const save = async () => {
    if (!pack) return;
    setBusy(true);
    const res = await createAdminBooking({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      location: form.location.trim(),
      notes: form.notes.trim(),
      serviceSlug,
      serviceName: services.find((s) => s.slug === serviceSlug)?.name ?? "",
      packageRef,
      totalPaise: parsePrice(pack.price) * 100,
      advancePercent: config.booking.advancePercent,
      startDay: dateMode === "single" ? day : rangeStart,
      endDay: dateMode === "single" ? day : rangeEnd,
      slotId,
      slotStart: slot?.start ?? "08:00",
      slotEnd: slot?.end ?? "19:00",
      status,
      cashKind,
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Booking created.");
      onCreated();
      onClose();
    } else {
      toast.error(res.message);
    }
  };

  const label = "mb-1 block text-[0.82rem] font-medium";
  const field =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-[0.88rem] outline-none focus:border-foreground";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-light tracking-[-0.028em]">New booking</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Name *</label>
              <input
                className={field}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className={label}>Phone *</label>
              <input
                className={field}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Email</label>
              <input
                className={field}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className={label}>Location</label>
              <input
                className={field}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Service</label>
              <select
                className={field}
                value={serviceSlug}
                onChange={(e) => {
                  setServiceSlug(e.target.value);
                  setPackageRef("");
                }}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Package *</label>
              <select
                className={field}
                value={packageRef}
                onChange={(e) => setPackageRef(e.target.value)}
              >
                <option value="">Select…</option>
                {packagesForService.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.price}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* date */}
          <div>
            <div className="mb-2 flex gap-1.5">
              {(["single", "range"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDateMode(m)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[0.82rem] font-medium transition-colors",
                    dateMode === m
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:border-foreground"
                  )}
                >
                  {m === "single" ? "Single day" : "Date range"}
                </button>
              ))}
            </div>

            <BookingCalendar
              mode={dateMode}
              selected={day}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onSelect={setDay}
              onRangeSelect={(a, b) => {
                setRangeStart(a);
                setRangeEnd(b);
              }}
            />

            {dateMode === "range" && rangeStart ? (
              <p className="mt-2 text-[0.82rem] text-muted-foreground">
                {rangeEnd
                  ? `${formatLongDate(rangeStart)} → ${formatLongDate(rangeEnd)}`
                  : `${formatLongDate(rangeStart)} → pick an end date`}
              </p>
            ) : null}

            {dateMode === "single" ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {config.booking.slots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSlotId(s.id)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-[0.82rem] transition-colors",
                      slotId === s.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <label className={label}>Notes</label>
            <textarea
              className={field}
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Status</label>
              <select
                className={field}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="confirmed">Confirmed</option>
                <option value="held">Held (tentative)</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className={label}>Cash taken</label>
              <select
                className={field}
                value={cashKind}
                onChange={(e) => setCashKind(e.target.value as typeof cashKind)}
              >
                <option value="none">None yet</option>
                <option value="advance">Advance</option>
                <option value="full">Full</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            disabled={!canSave}
            onClick={save}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-[0.92rem] font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))] disabled:opacity-40"
          >
            {busy ? "Saving…" : "Create booking"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBookingForm;
