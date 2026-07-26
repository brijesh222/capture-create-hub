import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Star } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getWhatsAppLink } from "@/lib/site-config-utils";
import { getCategoryThumbnail } from "@/lib/category-images";
import BookingFlow, { type BookingStart } from "@/components/booking/BookingFlow";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import FloatingActions from "@/components/site/FloatingActions";
import ServicePackages from "@/components/site/ServicePackages";
import PhotoGrid, { type GridPhoto } from "@/components/site/PhotoGrid";
import { SectionHeading, WhatsAppDot } from "@/components/site/parts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { config } = useSiteConfig();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [start, setStart] = useState<BookingStart>({});

  const openBooking = (packageId?: string) => {
    setStart({ serviceSlug: slug, packageId });
    setBookingOpen(true);
  };

  const service = config.categories.find((c) => c.slug === slug);

  useEffect(() => {
    if (!service) return;
    document.title =
      service.seoTitle || `${service.name} Photography | ${config.branding.siteName}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        service.seoDescription || service.intro || service.description
      );
    }
  }, [service, config.branding.siteName]);

  // Gallery prefers uploaded media, then the cover photo, so the page is never bare.
  const gallery: GridPhoto[] = useMemo(() => {
    if (!service) return [];
    if (service.media?.length) {
      return service.media.map((m) => ({ id: m.id, url: m.url, caption: m.caption }));
    }
    return [
      {
        id: `${service.slug}-cover`,
        url: getCategoryThumbnail(service.thumbnailUrl, service.slug),
      },
    ];
  }, [service]);

  const reviews = useMemo(
    () => config.reviews.items.filter((r) => r.serviceSlug === service?.slug),
    [config.reviews.items, service?.slug]
  );

  const others = config.categories
    .filter((c) => c.visible !== false && c.slug !== slug)
    .slice(0, 4);

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader onBook={() => openBooking()} />
        <div className="shell flex flex-col items-start gap-4 py-24">
          <h1 className="heading-lg">Service not found</h1>
          <p className="text-[hsl(var(--ink-soft))]">
            That page may have been renamed or removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.92rem] font-medium text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const cover =
    service.coverImageUrl || getCategoryThumbnail(service.thumbnailUrl, service.slug);
  const faqItems = service.faqItems?.length ? service.faqItems : config.faq.items;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader onBook={() => openBooking()} />

      <main>
        {/* ---------- hero ---------- */}
        <section className="shell py-8 md:py-12">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-[0.85rem] text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            All services
          </Link>

          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
            <div>
              <div className="eyebrow">{service.startingPrice || "Photography"}</div>
              <h1 className="heading-xl mt-3">
                {service.name} <strong>photography</strong>
              </h1>
              <p className="mt-4 max-w-[28rem] text-[1.03rem] text-[hsl(var(--ink-soft))]">
                {service.intro || service.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => openBooking()}
                  className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-[0.92rem] font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))]"
                >
                  Check available dates
                </button>
                <a
                  href={getWhatsAppLink(config)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-[0.92rem] font-medium transition-colors hover:border-[hsl(var(--whatsapp))]"
                >
                  <WhatsAppDot />
                  Ask a question
                </a>
              </div>

              {service.reassurance?.length ? (
                <ul className="mt-6 flex flex-col gap-1.5 text-[0.85rem] text-muted-foreground">
                  {service.reassurance.map((r) => (
                    <li key={r} className="flex items-start gap-1.5">
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div
              className="aspect-[4/3] rounded-[20px] bg-muted bg-cover bg-center lg:aspect-[4/5]"
              style={{ backgroundImage: `url(${cover})` }}
              role="img"
              aria-label={`${service.name} photography`}
            />
          </div>
        </section>

        {/* ---------- what's included ---------- */}
        {service.included?.length ? (
          <section className="shell py-12 md:py-14">
            <div className="rounded-[20px] bg-primary px-6 py-10 text-primary-foreground md:px-10 md:py-12">
              <h2 className="heading-lg mb-7">
                What's <strong>included</strong>
              </h2>
              <ul className="grid gap-4 md:grid-cols-2 md:gap-x-10">
                {service.included.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[0.95rem]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* ---------- gallery ---------- */}
        <section id="work" className="shell py-12 md:py-14">
          <SectionHeading
            heading="Recent "
            highlight={`${service.name.toLowerCase()} work`}
            subheading={
              service.media?.length
                ? "A selection from recent shoots."
                : "More from this service coming soon."
            }
          />
          {gallery.length === 1 ? (
            /* A single photo in a masonry gallery reads as a broken layout, so
               one image gets shown wide instead. */
            <img
              src={gallery[0].url}
              alt={`${service.name} photography`}
              className="w-full rounded-[20px] bg-muted object-cover"
            />
          ) : (
            <PhotoGrid
              photos={gallery}
              alt={`${service.name} photograph`}
              initialCount={12}
              step={12}
            />
          )}
        </section>

        {/* ---------- packages ---------- */}
        <ServicePackages
          serviceSlug={service.slug}
          serviceName={service.name}
          onBook={openBooking}
        />

        {/* ---------- review ---------- */}
        {reviews.length ? (
          <section className="shell py-12 md:py-14">
            <figure className="mx-auto flex max-w-[42rem] flex-col items-center gap-4 text-center">
              <div
                className="flex gap-0.5"
                role="img"
                aria-label={`${reviews[0].rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4"
                    aria-hidden="true"
                    fill={i < reviews[0].rating ? "hsl(var(--star))" : "none"}
                    stroke="hsl(var(--star))"
                  />
                ))}
              </div>
              <blockquote className="text-[1.15rem] font-light leading-relaxed">
                &ldquo;{reviews[0].text}&rdquo;
              </blockquote>
              <figcaption className="text-[0.85rem] text-muted-foreground">
                {reviews[0].name} · {reviews[0].meta}
              </figcaption>
            </figure>
          </section>
        ) : null}

        {/* ---------- faq ---------- */}
        {faqItems.length ? (
          <section className="shell py-12 md:py-14">
            <SectionHeading
              heading="Questions about "
              highlight={service.name.toLowerCase()}
            />
            <Accordion type="single" collapsible defaultValue={faqItems[0]?.id}>
              {faqItems.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border-border">
                  <AccordionTrigger className="py-4 text-left text-base font-medium hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-[44rem] text-[0.94rem] text-[hsl(var(--ink-soft))]">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ) : null}

        {/* ---------- book ---------- */}
        <section id="book" className="shell py-12 md:py-14">
          <div className="flex flex-col items-center gap-4 rounded-[20px] border border-border bg-card px-6 py-11 text-center md:px-8 md:py-14">
            <div className="eyebrow">Available now</div>
            <h2 className="heading-lg max-w-[26rem] text-[clamp(1.7rem,3.6vw,2.4rem)]">
              Ready to book your <strong>{service.name.toLowerCase()} shoot</strong>?
            </h2>
            <p className="max-w-[30rem] text-[0.97rem] text-[hsl(var(--ink-soft))]">
              Check which dates are free and book in about two minutes. Not sure yet?
              Message us and we&rsquo;ll talk it through.
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={() => openBooking()}
                className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-[0.92rem] font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))]"
              >
                Check available dates
              </button>
              <a
                href={getWhatsAppLink(config)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-[0.92rem] font-medium transition-colors hover:border-[hsl(var(--whatsapp))]"
              >
                <WhatsAppDot />
                WhatsApp us
              </a>
            </div>
          </div>
        </section>

        {/* ---------- other services ---------- */}
        {others.length ? (
          <section className="shell py-12 md:py-14">
            <SectionHeading heading="Also " highlight="shooting" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
              {others.map((other) => (
                <Link
                  key={other.id}
                  to={`/category/${other.slug}`}
                  className="group flex flex-col gap-3"
                >
                  <div
                    className="aspect-[3/4] rounded-[14px] bg-muted bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.015]"
                    style={{
                      backgroundImage: `url(${getCategoryThumbnail(
                        other.thumbnailUrl,
                        other.slug
                      )})`,
                    }}
                  />
                  <span className="flex items-center gap-1.5 text-base font-semibold">
                    {other.name}
                    <ArrowRight
                      className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
      <FloatingActions onBook={() => openBooking()} />
      <BookingFlow open={bookingOpen} onOpenChange={setBookingOpen} start={start} />
    </div>
  );
};

export default CategoryPage;
