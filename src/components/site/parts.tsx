import { cn } from "@/lib/utils";

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

/** Small green dot that marks WhatsApp actions without needing a logo file. */
export function WhatsAppDot() {
  return (
    <span
      aria-hidden="true"
      className="h-[9px] w-[9px] shrink-0 rounded-full bg-[hsl(var(--whatsapp))]"
    />
  );
}
