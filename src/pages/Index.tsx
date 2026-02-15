import Hero from "@/components/Hero";
import CategoryCarousel from "@/components/CategoryCarousel";
import AboutSection from "@/components/AboutSection";
import WhatsAppCTA from "@/components/WhatsAppCTA";
import Footer from "@/components/Footer";
import FloatingCTA from "@/components/FloatingCTA";

const Index = () => {
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
