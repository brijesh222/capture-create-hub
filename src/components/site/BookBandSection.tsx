import { useSiteConfig } from "@/context/SiteConfigContext";
import { getWhatsAppLink } from "@/lib/site-config-utils";
import { WhatsAppDot } from "./parts";

const BookBandSection = ({ onBook }: { onBook: () => void }) => {
  const { config } = useSiteConfig();
  const { bookBand } = config;

  if (!bookBand.enabled) return null;

  return (
    <section id="book" className="shell py-12 md:py-14">
      <div className="flex flex-col items-center gap-4 rounded-[20px] border border-border bg-card px-6 py-11 text-center md:px-8 md:py-14">
        {bookBand.eyebrow ? <div className="eyebrow">{bookBand.eyebrow}</div> : null}

        <h2 className="heading-lg max-w-[26rem] text-[clamp(1.7rem,3.6vw,2.4rem)]">
          {bookBand.heading}
          {bookBand.headingHighlight ? <strong>{bookBand.headingHighlight}</strong> : null}
        </h2>

        {bookBand.body ? (
          <p className="max-w-[30rem] text-[0.97rem] text-[hsl(var(--ink-soft))]">
            {bookBand.body}
          </p>
        ) : null}

        <div className="mt-1 flex flex-wrap justify-center gap-2.5">
          <button
            type="button"
            onClick={onBook}
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-[0.92rem] font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))]"
          >
            {bookBand.primaryText}
          </button>
          <a
            href={getWhatsAppLink(config)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-[0.92rem] font-medium transition-colors hover:border-[hsl(var(--whatsapp))]"
          >
            <WhatsAppDot />
            {bookBand.whatsappText}
          </a>
        </div>
      </div>
    </section>
  );
};

export default BookBandSection;
