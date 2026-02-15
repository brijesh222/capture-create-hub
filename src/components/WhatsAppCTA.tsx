import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getWhatsAppLink, getSectionStyle } from "@/lib/site-config-utils";

const WhatsAppCTA = () => {
  const { config } = useSiteConfig();
  const whatsappLink = getWhatsAppLink(config);
  const sectionStyle = getSectionStyle(config, "whatsapp-cta");
  const hasStyleOverrides = sectionStyle && Object.keys(sectionStyle).length > 0;

  return (
    <section className="px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={`mx-auto max-w-xl rounded-2xl border p-8 text-center md:p-12 ${!hasStyleOverrides ? "border-primary/20 bg-card shadow-gold" : ""}`}
        style={hasStyleOverrides ? sectionStyle : undefined}
      >
        <MessageCircle className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h3 className="mb-2 font-display text-2xl font-bold text-foreground md:text-3xl">
          Prefer WhatsApp?
        </h3>
        <p className="mb-6 font-body text-muted-foreground">
          Get instant responses and quick quotes on WhatsApp. We're just a
          message away!
        </p>
        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          href={whatsappLink}
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
