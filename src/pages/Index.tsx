import { useEffect } from "react";
import Hero from "@/components/Hero";
import CategoryCarousel from "@/components/CategoryCarousel";
import AboutSection from "@/components/AboutSection";
import WhatsAppCTA from "@/components/WhatsAppCTA";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import { useSiteConfig } from "@/context/SiteConfigContext";

const Index = () => {
  const { config } = useSiteConfig();

  useEffect(() => {
    if (config.branding?.documentTitle) {
      document.title = config.branding.documentTitle;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && config.branding?.metaDescription) {
      metaDesc.setAttribute("content", config.branding.metaDescription);
    }
  }, [config.branding?.documentTitle, config.branding?.metaDescription]);

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <CategoryCarousel />
      <AboutSection />
      <WhatsAppCTA />
      <Footer />
      <FloatingCTA />
    </div>
  );
};

export default Index;
