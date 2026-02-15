export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export const categories: Category[] = [
  { id: "1", name: "Wedding", slug: "wedding", description: "Timeless moments of your special day", icon: "💍" },
  { id: "2", name: "Pre Wedding", slug: "pre-wedding", description: "Romantic stories before the big day", icon: "💑" },
  { id: "3", name: "Birthday", slug: "birthday", description: "Celebrate life's joyful milestones", icon: "🎂" },
  { id: "4", name: "Maternity", slug: "maternity", description: "Beautiful journey of motherhood", icon: "🤰" },
  { id: "5", name: "Business Promo", slug: "business-promo", description: "Elevate your brand presence", icon: "💼" },
  { id: "6", name: "Hotel / Resort / Interior", slug: "hotel-resort-interior", description: "Stunning architectural & hospitality shoots", icon: "🏨" },
  { id: "7", name: "Product", slug: "product", description: "Showcase your products beautifully", icon: "📦" },
  { id: "8", name: "Food", slug: "food", description: "Mouth-watering culinary visuals", icon: "🍽️" },
];

export const WHATSAPP_NUMBER = "917023433374";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;
export const EMAIL = "brijeshprajapat52@gmail.com";

export const budgetOptions = [
  "Under ₹5,000",
  "₹5,000 - ₹10,000",
  "₹10,000 - ₹20,000",
  "₹20,000 - ₹30,000",
  "₹30,000 - ₹50,000",
  "Need Custom Quote",
];
