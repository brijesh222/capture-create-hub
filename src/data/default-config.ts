import type { SiteConfig } from "@/types/site-config";

export const defaultSiteConfig: SiteConfig = {
  hero: {
    backgroundImageUrl: "",
    tagline: "Premium Photography & Videography",
    title: "We Capture Moments ",
    titleHighlight: "That Last Forever",
    subtitle:
      "From grand weddings to intimate celebrations — we craft visual stories that speak your emotions.",
    ctaBookText: "Book Now",
    ctaWhatsAppText: "WhatsApp Connect",
  },
  categories: [
    { id: "1", name: "Wedding", slug: "wedding", description: "Timeless moments of your special day", icon: "💍", thumbnailUrl: "", media: [] },
    { id: "2", name: "Pre Wedding", slug: "pre-wedding", description: "Romantic stories before the big day", icon: "💑", thumbnailUrl: "", media: [] },
    { id: "3", name: "Birthday", slug: "birthday", description: "Celebrate life's joyful milestones", icon: "🎂", thumbnailUrl: "", media: [] },
    { id: "4", name: "Maternity", slug: "maternity", description: "Beautiful journey of motherhood", icon: "🤰", thumbnailUrl: "", media: [] },
    { id: "5", name: "Business Promo", slug: "business-promo", description: "Elevate your brand presence", icon: "💼", thumbnailUrl: "", media: [] },
    { id: "6", name: "Hotel / Resort / Interior", slug: "hotel-resort-interior", description: "Stunning architectural & hospitality shoots", icon: "🏨", thumbnailUrl: "", media: [] },
    { id: "7", name: "Product", slug: "product", description: "Showcase your products beautifully", icon: "📦", thumbnailUrl: "", media: [] },
    { id: "8", name: "Food", slug: "food", description: "Mouth-watering culinary visuals", icon: "🍽️", thumbnailUrl: "", media: [] },
  ],
  contact: {
    whatsappNumber: "917023433374",
    email: "brijeshprajapat52@gmail.com",
    location: "Rajasthan, India",
    footerBrandName: "BP Productions",
    footerTagline: "Premium photography & videography services. Capturing moments that last forever.",
    footerCopyrightPrefix: "BP Productions",
  },
  form: {
    formTitle: "Book Your Shoot",
    formSubtitle: "Fill in the details and we'll get back to you within 24 hours.",
    submitButtonText: "Submit Booking Request",
    budgetOptions: [
      "Under ₹5,000",
      "₹5,000 - ₹10,000",
      "₹10,000 - ₹20,000",
      "₹20,000 - ₹30,000",
      "₹30,000 - ₹50,000",
      "Need Custom Quote",
    ],
    fields: [
      { id: "f1", key: "name", label: "Name", placeholder: "Your full name", type: "text", required: true },
      { id: "f2", key: "phone", label: "Phone Number", placeholder: "+91 XXXXX XXXXX", type: "tel", required: true },
      { id: "f3", key: "city", label: "City", placeholder: "Your city", type: "text", required: true },
      { id: "f4", key: "shootType", label: "Type of Shoot", placeholder: "Select category", type: "select", required: true, optionsSource: "categories" },
      { id: "f5", key: "budget", label: "Budget", placeholder: "Select budget range", type: "select", required: false, optionsSource: "budget" },
      { id: "f6", key: "preferredDate", label: "Preferred Date", placeholder: "", type: "date", required: false },
      { id: "f7", key: "message", label: "Message", placeholder: "Tell us more about your vision...", type: "textarea", required: false },
    ],
  },
  redirections: {
    whatsappLink: "https://wa.me/917023433374",
    bookNowRedirectUrl: "",
  },
  branding: {
    siteName: "BP Productions",
    logoUrl: "",
    documentTitle: "BP Productions | Photography & Videography",
    metaDescription: "Premium photography & videography. Capturing moments that last forever.",
    siteBackgroundColor: "",
    siteBackgroundImage: "",
  },
  customThemeColors: {},
  sectionStyles: {
    hero: {},
    categories: {},
    about: {},
    "whatsapp-cta": {},
    footer: {},
    "floating-cta": {},
    "category-header": {},
    gallery: {},
  },
  activeThemeId: "default",
  themePresets: [
    {
      id: "default",
      name: "Default (Gold & Charcoal)",
      cssVars: {
        "--primary": "38 90% 50%",
        "--primary-foreground": "25 20% 6%",
        "--accent": "38 75% 42%",
        "--gold": "38 90% 50%",
        "--gold-light": "38 85% 65%",
        "--gold-dark": "38 80% 35%",
        "--border": "38 18% 18%",
      },
    },
    {
      id: "diwali",
      name: "Diwali (Festive Gold & Deep Red)",
      cssVars: {
        "--primary": "25 85% 45%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "25 85% 45%",
        "--gold": "25 85% 45%",
        "--gold-light": "25 80% 60%",
        "--gold-dark": "25 75% 35%",
        "--border": "25 40% 25%",
      },
    },
    {
      id: "valentines",
      name: "Valentine's Day (Rose & Blush)",
      cssVars: {
        "--primary": "350 70% 55%",
        "--primary-foreground": "0 0% 100%",
        "--accent": "350 65% 60%",
        "--gold": "350 70% 55%",
        "--gold-light": "350 75% 70%",
        "--gold-dark": "350 65% 40%",
        "--border": "350 30% 25%",
      },
    },
    {
      id: "minimal",
      name: "Minimal (Black & White)",
      cssVars: {
        "--primary": "0 0% 20%",
        "--primary-foreground": "0 0% 98%",
        "--accent": "0 0% 30%",
        "--gold": "0 0% 35%",
        "--gold-light": "0 0% 50%",
        "--gold-dark": "0 0% 15%",
        "--border": "0 0% 22%",
      },
    },
  ],
};

const STORAGE_KEY = "portfolio-admin-config";

export function loadSiteConfig(): SiteConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSiteConfig;
    const parsed = JSON.parse(raw) as Partial<SiteConfig>;
    return mergeWithDefaults(parsed);
  } catch {
    return defaultSiteConfig;
  }
}

export function saveSiteConfig(config: SiteConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function mergeWithDefaults(partial: Partial<SiteConfig>): SiteConfig {
  return {
    hero: { ...defaultSiteConfig.hero, ...partial.hero },
    categories: partial.categories?.length
      ? partial.categories.map((c) => ({
          ...defaultSiteConfig.categories[0],
          ...c,
          media: c.media ?? [],
        }))
      : defaultSiteConfig.categories,
    contact: { ...defaultSiteConfig.contact, ...partial.contact },
    form: {
      ...defaultSiteConfig.form,
      ...partial.form,
      fields: (partial.form?.fields?.length ? partial.form.fields : defaultSiteConfig.form.fields).map((f, i) => ({
        ...f,
        id: (f as { id?: string }).id || `f-${i}`,
        options: (f as { options?: string[] }).options ?? [],
      })),
      budgetOptions: partial.form?.budgetOptions?.length ? partial.form.budgetOptions : defaultSiteConfig.form.budgetOptions,
    },
    redirections: { ...defaultSiteConfig.redirections, ...partial.redirections },
    branding: { ...defaultSiteConfig.branding, ...partial.branding },
    sectionStyles: { ...defaultSiteConfig.sectionStyles, ...partial.sectionStyles },
    themePresets: partial.themePresets?.length ? partial.themePresets : defaultSiteConfig.themePresets,
    activeThemeId: partial.activeThemeId ?? defaultSiteConfig.activeThemeId,
    customThemeColors: { ...defaultSiteConfig.customThemeColors, ...partial.customThemeColors },
  };
}
