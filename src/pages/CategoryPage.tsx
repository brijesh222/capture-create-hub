import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { categories } from "@/data/categories";

import catWedding from "@/assets/cat-wedding.jpg";
import catPreWedding from "@/assets/cat-pre-wedding.jpg";
import catBirthday from "@/assets/cat-birthday.jpg";
import catMaternity from "@/assets/cat-maternity.jpg";
import catBusiness from "@/assets/cat-business.jpg";
import catHotel from "@/assets/cat-hotel.jpg";
import catProduct from "@/assets/cat-product.jpg";
import catFood from "@/assets/cat-food.jpg";

const categoryImages: Record<string, string> = {
  wedding: catWedding,
  "pre-wedding": catPreWedding,
  birthday: catBirthday,
  maternity: catMaternity,
  "business-promo": catBusiness,
  "hotel-resort-interior": catHotel,
  product: catProduct,
  food: catFood,
};

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="text-center">
          <h1 className="mb-4 font-display text-3xl text-foreground">Category Not Found</h1>
          <Link to="/" className="font-body text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const image = categoryImages[category.slug];

  // Placeholder gallery — in the future, admin will upload real photos
  const galleryItems = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    image,
  }));

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className="relative h-[40vh] overflow-hidden">
        <img
          src={image}
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
            <p className="font-body text-muted-foreground">{category.description}</p>
          </motion.div>
        </div>
      </div>

      {/* Back */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Gallery Grid */}
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="overflow-hidden rounded-xl shadow-elevated"
            >
              <img
                src={item.image}
                alt={`${category.name} ${idx + 1}`}
                className="h-64 w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="font-body text-muted-foreground">
            More photos coming soon! Contact us to see the full portfolio.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
