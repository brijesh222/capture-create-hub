import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { SectionHeading } from "./parts";
import { categoryFallbackImage } from "@/lib/category-images";

const ServicesSection = () => {
  const { config } = useSiteConfig();
  const services = config.categories.filter((c) => c.visible !== false);

  if (!services.length) return null;

  return (
    <section id="services" className="shell py-12 md:py-14">
      <SectionHeading
        heading={config.servicesHeading}
        highlight={config.servicesHeadingHighlight}
        subheading={config.servicesSubheading}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {services.map((service) => (
          <Link
            key={service.id}
            to={`/category/${service.slug}`}
            className="group flex flex-col gap-3"
          >
            <div
              className="aspect-[3/4] rounded-[14px] bg-muted bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.015]"
              style={{
                backgroundImage: `url(${
                  service.thumbnailUrl || categoryFallbackImage(service.slug)
                })`,
              }}
            />
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-base font-semibold">
                {service.name}
                <ArrowRight
                  className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
              {service.startingPrice ? (
                <span className="text-[0.85rem] text-muted-foreground">
                  {service.startingPrice}
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ServicesSection;
