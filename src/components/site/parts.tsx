import { cn } from "@/lib/utils";
import { parsePrice } from "@/lib/booking";

/**
 * Section headings are written as a light phrase plus one bold span, e.g.
 * "What we " + "shoot". Both halves are admin-editable, which is why they
 * arrive as two separate strings.
 */
export function SectionHeading({
  heading,
  highlight,
  subheading,
  className,
}: {
  heading: string;
  highlight?: string;
  subheading?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex max-w-[38rem] flex-col gap-2", className)}>
      <h2 className="heading-lg">
        {heading}
        {highlight ? <strong>{highlight}</strong> : null}
      </h2>
      {subheading ? (
        <p className="text-[0.97rem] text-muted-foreground">{subheading}</p>
      ) : null}
    </div>
  );
}

/**
 * The price block on a package card. When `originalPrice` is set and higher
 * than `price`, the original is struck through, the offer price is highlighted,
 * and a "Save X%" badge appears. Shared so both package layouts stay in sync.
 */
export function PackagePrice({
  price,
  originalPrice,
  priceNote,
}: {
  price: string;
  originalPrice?: string;
  priceNote?: string;
}) {
  const now = parsePrice(price);
  const was = originalPrice ? parsePrice(originalPrice) : 0;
  const hasOffer = was > 0 && now > 0 && was > now;
  const pct = hasOffer ? Math.round(((was - now) / was) * 100) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={cn(
            "text-[1.85rem] tabular-nums tracking-[-0.03em]",
            hasOffer ? "font-medium text-primary" : "font-light"
          )}
        >
          {price}
        </span>
        {originalPrice ? (
          <span className="text-[1.05rem] font-light tabular-nums text-muted-foreground line-through">
            {originalPrice}
          </span>
        ) : null}
        {hasOffer ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-[0.06em] text-primary">
            Save {pct}%
          </span>
        ) : null}
      </div>
      {priceNote ? (
        <div className="mt-0.5 text-[0.82rem] text-muted-foreground">{priceNote}</div>
      ) : null}
    </div>
  );
}

/** Small green dot that marks WhatsApp actions without needing a logo file. */
export function WhatsAppDot() {
  return (
    <span
      aria-hidden="true"
      className="h-[9px] w-[9px] shrink-0 rounded-full bg-[hsl(var(--whatsapp))]"
    />
  );
}
