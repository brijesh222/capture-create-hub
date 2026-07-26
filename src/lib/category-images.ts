import catWedding from "@/assets/cat-wedding.jpg";
import catPreWedding from "@/assets/cat-pre-wedding.jpg";
import catBirthday from "@/assets/cat-birthday.jpg";
import catMaternity from "@/assets/cat-maternity.jpg";
import catBusiness from "@/assets/cat-business.jpg";
import catHotel from "@/assets/cat-hotel.jpg";
import catProduct from "@/assets/cat-product.jpg";
import catFood from "@/assets/cat-food.jpg";

/**
 * Placeholder imagery, used only until a category has its own uploaded photo.
 * These ship with the template and are not the studio's own work.
 */
export const defaultCategoryImages: Record<string, string> = {
  wedding: catWedding,
  "pre-wedding": catPreWedding,
  birthday: catBirthday,
  maternity: catMaternity,
  "business-promo": catBusiness,
  "hotel-resort-interior": catHotel,
  product: catProduct,
  food: catFood,
};

/** Falls back through: slug match, then any placeholder, then empty. */
export function categoryFallbackImage(slug: string): string {
  return defaultCategoryImages[slug] || Object.values(defaultCategoryImages)[0] || "";
}

/** Uploaded photo wins; otherwise a placeholder for the slug. */
export function getCategoryThumbnail(thumbnailUrl: string, slug: string): string {
  return thumbnailUrl?.trim() || categoryFallbackImage(slug);
}
