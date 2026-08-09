import { useEffect, useState } from "react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import BookingFlow, { type BookingStart } from "@/components/booking/BookingFlow";
import SiteHeader from "@/components/site/SiteHeader";
import HeroSection from "@/components/site/HeroSection";
import ServicesSection from "@/components/site/ServicesSection";
import HowItWorksSection from "@/components/site/HowItWorksSection";
import WorkSection from "@/components/site/WorkSection";
import PackagesSection from "@/components/site/PackagesSection";
import AboutBlock from "@/components/site/AboutBlock";
import ReviewsSection from "@/components/site/ReviewsSection";
import BookBandSection from "@/components/site/BookBandSection";
import FaqSection from "@/components/site/FaqSection";
import TeamSection from "@/components/site/TeamSection";
import LocationSection from "@/components/site/LocationSection";
import SiteFooter from "@/components/site/SiteFooter";
import FloatingActions from "@/components/site/FloatingActions";
import type { HomeSectionKey } from "@/types/site-config";

const Index = () => {
  const { config } = useSiteConfig();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [start, setStart] = useState<BookingStart>({});

  const openBooking = (packageId?: string) => {
    const pack = config.packages.items.find((p) => p.id === packageId);
    setStart({ serviceSlug: pack?.serviceSlug, packageId });
    setBookingOpen(true);
  };

  useEffect(() => {
    if (config.branding?.documentTitle) {
      document.title = config.branding.documentTitle;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && config.branding?.metaDescription) {
      metaDesc.setAttribute("content", config.branding.metaDescription);
    }
  }, [config.branding?.documentTitle, config.branding?.metaDescription]);

  // Order is admin-controlled, so sections are looked up by key rather than
  // written out in a fixed sequence.
  const sections: Record<HomeSectionKey, JSX.Element> = {
    services: <ServicesSection />,
    howItWorks: <HowItWorksSection />,
    work: <WorkSection />,
    packages: <PackagesSection onBook={openBooking} />,
    about: <AboutBlock />,
    reviews: <ReviewsSection />,
    bookBand: <BookBandSection onBook={() => openBooking()} />,
    faq: <FaqSection />,
    team: <TeamSection />,
    location: <LocationSection />,
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader onBook={() => openBooking()} />
      <main>
        <HeroSection onBook={() => openBooking()} />
        {config.sectionOrder.map((key) =>
          sections[key] ? <div key={key}>{sections[key]}</div> : null
        )}
      </main>
      <SiteFooter />
      <FloatingActions onBook={() => openBooking()} />
      <BookingFlow open={bookingOpen} onOpenChange={setBookingOpen} start={start} />
    </div>
  );
};

export default Index;
