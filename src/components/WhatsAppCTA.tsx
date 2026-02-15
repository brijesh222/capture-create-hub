import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_LINK } from "@/data/categories";

const WhatsAppCTA = () => {
  return (
    <section className="px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-xl rounded-2xl border border-primary/20 bg-card p-8 text-center shadow-gold md:p-12"
      >
        <MessageCircle className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h3 className="mb-2 font-display text-2xl font-bold text-foreground md:text-3xl">
          Prefer WhatsApp?
        </h3>
        <p className="mb-6 font-body text-muted-foreground">
          Get instant responses and quick quotes on WhatsApp. We're just a message
          away!
        </p>
        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-gold transition-all"
        >
          <MessageCircle className="h-4 w-4" />
          Chat on WhatsApp
        </motion.a>
      </motion.div>
    </section>
  );
};

export default WhatsAppCTA;
