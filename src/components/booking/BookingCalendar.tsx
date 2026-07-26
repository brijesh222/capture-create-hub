import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { buildMonth, MONTH_NAMES, startOfDay } from "@/lib/booking";
import { cn } from "@/lib/utils";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

const BookingCalendar = ({
  selected,
  onSelect,
  fullDays,
}: {
  selected: string;
  onSelect: (iso: string) => void;
  /** Days with no slots left, from real bookings. */
  fullDays?: Set<string>;
}) => {
  const { config } = useSiteConfig();
  const today = startOfDay(new Date());
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const cells = useMemo(() => {
    const built = buildMonth(view.y, view.m, config.booking);
    // A day with every slot booked is unavailable even though the working-hours
    // rules say otherwise.
    return built.map((c) =>
      c.available && fullDays?.has(c.iso)
        ? { ...c, available: false, reason: "booked" as const }
        : c
    );
  }, [view, config.booking, fullDays]);

  // Never let the customer page back into months that are entirely in the past.
  const atFirstMonth =
    view.y === today.getFullYear() && view.m === today.getMonth();

  const shift = (delta: number) => {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={atFirstMonth}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <strong className="text-[0.95rem] font-semibold">
          {MONTH_NAMES[view.m]} {view.y}
        </strong>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {DOW.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) =>
          !cell.date ? (
            <span key={cell.iso} />
          ) : (
            <button
              key={cell.iso}
              type="button"
              disabled={!cell.available}
              onClick={() => onSelect(cell.iso)}
              aria-label={`${cell.date.getDate()} ${MONTH_NAMES[view.m]}${
                cell.available ? "" : " — unavailable"
              }`}
              aria-pressed={selected === cell.iso}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg text-[0.82rem] tabular-nums transition-colors",
                selected === cell.iso
                  ? "bg-primary font-semibold text-primary-foreground"
                  : cell.available
                    ? "border border-border bg-card hover:border-primary"
                    : cell.reason === "booked"
                      ? "text-muted-foreground/60 line-through"
                      : "text-muted-foreground/40"
              )}
            >
              {cell.date.getDate()}
            </button>
          )
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm border border-border bg-card" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
          Selected
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm bg-muted" />
          Unavailable
        </span>
      </div>
    </div>
  );
};

export default BookingCalendar;
