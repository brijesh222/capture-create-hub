import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import { WHATSAPP_LINK, EMAIL } from "@/data/categories";

const AboutSection = () => {
  return (
    <section className="px-6 py-16 md:py-24" id="about">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="mb-2 font-body text-sm uppercase tracking-[0.3em] text-primary">
            About Us
          </p>
          <h2 className="mb-6 font-display text-3xl font-bold text-foreground md:text-5xl">
            Crafting Visual Stories{" "}
            <span className="text-gradient-gold">Since Day One</span>
          </h2>
          <p className="mx-auto mb-12 max-w-2xl font-body text-base leading-relaxed text-muted-foreground md:text-lg">
            We are a passionate production company specializing in photography and
            videography. From grand weddings to intimate product shoots, we bring
            your vision to life with cinematic precision and artistic flair. Every
            frame we capture tells a story — your story.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid gap-6 sm:grid-cols-3"
        >
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-primary/40 hover:shadow-gold"
          >
            <Phone className="mb-3 h-6 w-6 text-primary" />
            <p className="font-body text-sm font-medium text-foreground">
              WhatsApp
            </p>
            <p className="font-body text-xs text-muted-foreground">
              +91 70234 33374
            </p>
          </a>

          <a
            href={`mailto:${EMAIL}`}
            className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-primary/40 hover:shadow-gold"
          >
            <Mail className="mb-3 h-6 w-6 text-primary" />
            <p className="font-body text-sm font-medium text-foreground">Email</p>
            <p className="font-body text-xs text-muted-foreground">{EMAIL}</p>
          </a>

          <div className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center">
            <MapPin className="mb-3 h-6 w-6 text-primary" />
            <p className="font-body text-sm font-medium text-foreground">
              Location
            </p>
            <p className="font-body text-xs text-muted-foreground">
              Rajasthan, India
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
