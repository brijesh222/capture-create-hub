import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getSectionStyle, getWhatsAppLink } from "@/lib/site-config-utils";
import BookingFormDialog from "@/components/BookingFormDialog";

import catWedding from "@/assets/cat-wedding.jpg";
import catPreWedding from "@/assets/cat-pre-wedding.jpg";
import catBirthday from "@/assets/cat-birthday.jpg";
import catMaternity from "@/assets/cat-maternity.jpg";
import catBusiness from "@/assets/cat-business.jpg";
import catHotel from "@/assets/cat-hotel.jpg";
import catProduct from "@/assets/cat-product.jpg";
import catFood from "@/assets/cat-food.jpg";

const defaultCategoryImages: Record<string, string> = {
  wedding: catWedding,
  "pre-wedding": catPreWedding,
  birthday: catBirthday,
  maternity: catMaternity,
  "business-promo": catBusiness,
  "hotel-resort-interior": catHotel,
  product: catProduct,
  food: catFood,
};

function getCategoryThumbnail(thumbnailUrl: string, slug: string): string {
  return (
    thumbnailUrl?.trim() ||
    defaultCategoryImages[slug] ||
    Object.values(defaultCategoryImages)[0] ||
    ""
  );
}

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { config } = useSiteConfig();
  const [bookingOpen, setBookingOpen] = useState(false);
  const category = config.categories.find((c) => c.slug === slug);
  const headerStyle = getSectionStyle(config, "category-header");
  const galleryStyle = getSectionStyle(config, "gallery");
  const whatsappLink = getWhatsAppLink(config);
  const hero = config.hero;

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="text-center">
          <h1 className="mb-4 font-display text-3xl text-foreground">
            Category Not Found
          </h1>
          <Link to="/" className="font-body text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const headerImage = getCategoryThumbnail(category.thumbnailUrl, category.slug);
  const hasMedia = category.media?.length > 0;
  const galleryItems = hasMedia
    ? category.media
    : Array.from({ length: 6 }, (_, i) => ({
        id: `placeholder-${i}`,
        type: "photo" as const,
        url: headerImage,
      }));

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div
        className="relative h-[40vh] overflow-hidden"
        style={headerStyle}
      >
        <img
          src={headerImage}
          alt={category.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-dark-overlay" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-2 block text-4xl">{category.icon}</span>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground md:text-5xl">
              {category.name}
            </h1>
            <p className="font-body text-muted-foreground">
              {category.description}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="mx-auto max-w-6xl px-6" style={galleryStyle}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((item, idx) => (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="overflow-hidden rounded-xl shadow-elevated"
            >
              {item.type === "video" ? (
                <div className="relative aspect-video w-full bg-muted">
                  {item.url ? (
                    <video
                      src={item.url}
                      controls
                      className="h-64 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center text-muted-foreground">
                      Video URL not set
                    </div>
                  )}
                </div>
              ) : (
                <img
                  src={item.url || headerImage}
                  alt={`${category.name} ${idx + 1}`}
                  className="h-64 w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              )}
            </motion.div>
          ))}
        </div>

        {!hasMedia && (
          <div className="mt-12 text-center">
            <p className="font-body text-muted-foreground">
              More photos coming soon! Contact us to see the full portfolio.
            </p>
          </div>
        )}

        {/* Book Now + WhatsApp CTA at end of photos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 flex flex-col items-center justify-center gap-4 pb-12 sm:flex-row"
        >
          <button
            type="button"
            onClick={() => setBookingOpen(true)}
            className="w-full rounded-lg bg-gradient-gold px-8 py-4 font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-gold transition-all hover:opacity-90 sm:w-auto"
          >
            {hero.ctaBookText}
          </button>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 px-8 py-4 font-body text-sm font-semibold uppercase tracking-wider text-primary transition-all hover:bg-primary/10 sm:w-auto"
          >
            <MessageCircle className="h-4 w-4" />
            {hero.ctaWhatsAppText}
          </a>
        </motion.div>
      </div>

      <BookingFormDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </div>
  );
};

export default CategoryPage;
