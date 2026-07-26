import type { BookingConfig, PackageItem } from "@/types/site-config";

/**
 * Package prices are authored as display strings ("₹15,000") so the admin can
 * type them naturally. Everything numeric derives from this.
 */
export function parsePrice(price: string): number {
  const digits = (price || "").replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function formatINR(amount: number): string {
  return `₹${new Intl.NumberFormat("en-IN").format(Math.round(amount))}`;
}

/** Rounded to whole rupees — nobody wants an invoice for ₹1,500.50. */
export function advanceAmount(pack: PackageItem | undefined, percent: number): number {
  if (!pack) return 0;
  return Math.round((parsePrice(pack.price) * percent) / 100);
}

export function balanceAmount(pack: PackageItem | undefined, percent: number): number {
  if (!pack) return 0;
  return parsePrice(pack.price) - advanceAmount(pack, percent);
}

/** Local YYYY-MM-DD. Avoids toISOString(), which shifts across timezones. */
export function toISODate(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export interface DayCell {
  /** null renders an empty leading cell before the 1st of the month. */
  date: Date | null;
  iso: string;
  available: boolean;
  /** Why it isn't available — drives the crossed-out vs faded styling. */
  reason?: "past" | "lead" | "closed" | "booked";
}

/**
 * Builds the calendar grid for a month, marking each day available or not.
 *
 * Availability here is config-driven: working days, blackout dates and a lead
 * time. Real per-slot booking data replaces `blackoutDates` once the database
 * is wired — the shape of this function does not change.
 */
export function buildMonth(year: number, month: number, booking: BookingConfig): DayCell[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = startOfDay(new Date());
  const earliest = new Date(today);
  earliest.setDate(earliest.getDate() + booking.leadTimeDays);

  const cells: DayCell[] = [];
  for (let i = 0; i < first.getDay(); i++) {
    cells.push({ date: null, iso: `pad-${i}`, available: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const iso = toISODate(date);
    let reason: DayCell["reason"];

    if (date < today) reason = "past";
    else if (date < earliest) reason = "lead";
    else if (!booking.workingDays.includes(date.getDay())) reason = "closed";
    else if (booking.blackoutDates.includes(iso)) reason = "booked";

    cells.push({ date, iso, available: !reason, reason });
  }

  return cells;
}

export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
