import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { getSectionStyle } from "@/lib/site-config-utils";

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

const CategoryCarousel = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { config } = useSiteConfig();
  const categories = config.categories;
  const sectionStyle = getSectionStyle(config, "categories");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile || !scrollRef.current) return;
    const el = scrollRef.current;
    let animId: number;
    let scrollPos = 0;

    const scroll = () => {
      scrollPos += 0.5;
      if (scrollPos >= el.scrollWidth / 2) scrollPos = 0;
      el.scrollLeft = scrollPos;
      animId = requestAnimationFrame(scroll);
    };

    animId = requestAnimationFrame(scroll);

    const pause = () => cancelAnimationFrame(animId);
    const resume = () => {
      animId = requestAnimationFrame(scroll);
    };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
    };
  }, [isMobile]);

  const handleClick = (slug: string) => {
    navigate(`/category/${slug}`);
  };

  const displayCategories = isMobile ? categories : [...categories, ...categories];

  return (
    <section className="py-16 md:py-24" style={sectionStyle}>
      <div className="px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-2 font-body text-sm uppercase tracking-[0.3em] text-primary">
            What We Do
          </p>
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-5xl">
            Our Specialities
          </h2>
          <p className="mx-auto mb-12 max-w-xl font-body text-muted-foreground">
            Every story is unique. Choose your category and explore our craft.
          </p>
        </motion.div>
      </div>

      <div
        ref={scrollRef}
        className={`flex gap-5 px-6 ${
          isMobile
            ? "snap-x snap-mandatory overflow-x-auto scrollbar-hide"
            : "overflow-hidden"
        }`}
      >
        {displayCategories.map((cat, idx) => {
          const thumb = getCategoryThumbnail(cat.thumbnailUrl, cat.slug);
          return (
            <motion.div
              key={`${cat.id}-${idx}`}
              whileHover={{ y: -8 }}
              onClick={() => handleClick(cat.slug)}
              className={`group cursor-pointer ${
                isMobile ? "w-[280px] flex-shrink-0 snap-center" : "w-[280px] flex-shrink-0"
              }`}
            >
              <div className="relative overflow-hidden rounded-xl shadow-elevated">
                <img
                  src={thumb}
                  alt={cat.name}
                  className="h-[360px] w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="mb-1 block text-2xl">{cat.icon}</span>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {cat.name}
                  </h3>
                  <p className="font-body text-xs text-muted-foreground">
                    {cat.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryCarousel;
