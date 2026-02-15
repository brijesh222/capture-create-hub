import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import heroImage from "@/assets/hero-wedding.jpg";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getWhatsAppLink, getSectionStyle } from "@/lib/site-config-utils";
import BookingFormDialog from "./BookingFormDialog";

const Hero = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const { config } = useSiteConfig();
  const hero = config.hero;
  const whatsappLink = getWhatsAppLink(config);
  const sectionStyle = getSectionStyle(config, "hero");
  const heroBgSrc = hero.backgroundImageUrl?.trim() || heroImage;

  return (
    <>
      <section
        className="relative h-screen w-full overflow-hidden"
        style={sectionStyle}
      >
        <div className="absolute inset-0">
          <img
            src={heroBgSrc}
            alt="Cinematic wedding photography"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-dark-overlay" />
        </div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <p className="mb-4 font-body text-sm uppercase tracking-[0.3em] text-primary">
              {hero.tagline}
            </p>
            <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-7xl">
              {hero.title}
              <span className="text-gradient-gold"> {hero.titleHighlight}</span>
            </h1>
            <p className="mb-10 font-body text-base text-muted-foreground sm:text-lg md:text-xl">
              {hero.subtitle}
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setBookingOpen(true)}
                className="w-full rounded-lg bg-gradient-gold px-8 py-4 font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-gold transition-all sm:w-auto"
              >
                {hero.ctaBookText}
              </motion.button>

              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 px-8 py-4 font-body text-sm font-semibold uppercase tracking-wider text-primary transition-all hover:bg-primary/10 sm:w-auto"
              >
                <MessageCircle className="h-4 w-4" />
                {hero.ctaWhatsAppText}
              </motion.a>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      <BookingFormDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </>
  );
};

export default Hero;
