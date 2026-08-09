export interface CategoryConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  thumbnailUrl: string;
  media: MediaItem[];
  /** Shown on the service card, e.g. "from ₹15,000". Blank hides it. */
  startingPrice?: string;
  /** Hide from the site without deleting the category. */
  visible?: boolean;

  /* --- service page --- */
  /** Wide image at the top of the service page. Falls back to thumbnailUrl. */
  coverImageUrl?: string;
  /** Opening paragraph on the service page. */
  intro?: string;
  /** "What's included" bullets — the deliverables people ask about. */
  included?: string[];
  /** Reassurance for the specific worries this service raises. */
  reassurance?: string[];
  /** Questions unique to this service. Falls back to the site-wide FAQ. */
  faqItems?: FaqItem[];
  /** Page title and description for search engines. */
  seoTitle?: string;
  seoDescription?: string;
  /** Optional theme preset applied only on this service's page (auto-theme by
   *  category, e.g. pink for maternity). Blank = use the site's default theme. */
  themeId?: string;
  /** YouTube links (videos or Reels) shown as embedded players on the service
   *  page. Reels render vertical automatically. */
  videos?: string[];
  /** @deprecated single video — migrated into `videos` on load. */
  videoUrl?: string;
}

export interface MediaItem {
  id: string;
  type: "photo" | "video";
  url: string;
  caption?: string;
}

/**
 * For select type:
 *   "categories" = the site's services
 *   "packages"   = packages for the service chosen in the shootType field
 *   "budget"     = form budget ranges
 *   "custom"     = field.options
 */
export type FormFieldOptionsSource = "categories" | "packages" | "budget" | "custom";

export interface FormFieldConfig {
  id: string; // unique id for React keys and edits
  key: string; // form state key, e.g. "name", "phone"
  label: string;
  placeholder: string;
  type: "text" | "tel" | "email" | "date" | "textarea" | "select";
  required: boolean;
  /** For select: where options come from */
  optionsSource?: FormFieldOptionsSource;
  /** For select with optionsSource "custom": the dropdown options */
  options?: string[];
}

export interface HeroSlide {
  id: string;
  type: "image" | "video";
  /** Image URL, or a YouTube link when type is "video". */
  url: string;
}

export interface HeroConfig {
  backgroundImageUrl: string;
  tagline: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  ctaBookText: string;
  ctaWhatsAppText: string;
  /** Optional YouTube link. When set (and no slides), a silent looping video
   *  fills the hero cover slot instead of the cover photo. */
  videoUrl?: string;
  /** Carousel of images/videos for the cover slot. When 1+ valid slides exist
   *  they replace the single photo/video, auto-playing and swipeable. */
  slides?: HeroSlide[];
}

export interface ContactConfig {
  whatsappNumber: string;
  email: string;
  location: string;
  footerBrandName: string;
  footerTagline: string;
  footerCopyrightPrefix: string;
  /** Instagram handle, e.g. "duskangle.in". Shown in the footer and on invoices. */
  instagram?: string;
  /** Public website, e.g. "www.duskangle.com". Shown in the footer and on invoices. */
  website?: string;
}

export interface FormConfig {
  formTitle: string;
  formSubtitle: string;
  submitButtonText: string;
  fields: FormFieldConfig[];
  budgetOptions: string[];
}

export interface RedirectionsConfig {
  whatsappLink: string; // can override computed from number
  bookNowRedirectUrl: string; // optional, if set form might redirect
}

export interface BrandingConfig {
  siteName: string;
  logoUrl: string;
  documentTitle: string;
  metaDescription: string;
  /** Whole site background color (hex or CSS color) */
  siteBackgroundColor?: string;
  /** Whole site background image URL */
  siteBackgroundImage?: string;
}

/** CSS variable name (without --) -> hex color. Applied to :root for theme. */
export type CustomThemeColors = Record<string, string>;

export const THEME_COLOR_KEYS = [
  "background",
  "foreground",
  "primary",
  "primary-foreground",
  "card",
  "card-foreground",
  "border",
  "muted",
  "muted-foreground",
  "accent",
  "gold",
] as const;

export interface SectionStyleConfig {
  backgroundColor?: string;
  borderColor?: string;
  shadow?: string;
}

export type SectionId =
  | "hero"
  | "categories"
  | "about"
  | "whatsapp-cta"
  | "footer"
  | "floating-cta"
  | "category-header"
  | "gallery";

export interface ThemePreset {
  id: string;
  name: string;
  cssVars: Record<string, string>;
}

/* ---------------------------------------------------------------------------
 * Home page sections
 *
 * Each section carries its own `enabled` flag and its own copy, so the admin
 * can hide or rewrite any of them. Order is controlled by `sectionOrder`.
 * ------------------------------------------------------------------------- */

export interface NavLink {
  id: string;
  label: string;
  href: string;
}

export interface NavConfig {
  links: NavLink[];
  ctaText: string;
}

export interface HowItWorksStep {
  id: string;
  title: string;
  body: string;
}

export interface HowItWorksConfig {
  enabled: boolean;
  heading: string;
  headingHighlight: string;
  steps: HowItWorksStep[];
}

export interface WorkPhoto {
  id: string;
  url: string;
  /** "tall" spans two rows in the grid on desktop. */
  size: "normal" | "tall";
  caption?: string;
}

export interface WorkConfig {
  enabled: boolean;
  heading: string;
  headingHighlight: string;
  subheading: string;
  photos: WorkPhoto[];
  ctaText: string;
  ctaHref: string;
  /** Optional YouTube link shown as an embedded player above the photo grid. */
  videoUrl?: string;
}

export interface PackageItem {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  features: string[];
  featured: boolean;
  tag: string;
  ctaText: string;
  /** Which service this belongs to. Blank shows it on every service page. */
  serviceSlug?: string;
  /** Original price before a discount. When set, it's shown struck-through
   *  next to `price` (the offer price). Blank = no discount shown. */
  originalPrice?: string;
}

export interface PackagesConfig {
  enabled: boolean;
  heading: string;
  headingHighlight: string;
  subheading: string;
  items: PackageItem[];
}

export interface AboutStat {
  id: string;
  value: string;
  label: string;
}

export interface AboutConfig {
  enabled: boolean;
  heading: string;
  headingHighlight: string;
  photoUrl: string;
  /** One entry per paragraph. */
  paragraphs: string[];
  stats: AboutStat[];
}

export interface ReviewItem {
  id: string;
  name: string;
  meta: string;
  rating: number;
  text: string;
  /** Lets a service page show reviews from that service only. */
  serviceSlug?: string;
}

export interface ReviewsConfig {
  enabled: boolean;
  heading: string;
  headingHighlight: string;
  items: ReviewItem[];
}

export interface BookBandConfig {
  enabled: boolean;
  eyebrow: string;
  heading: string;
  headingHighlight: string;
  body: string;
  primaryText: string;
  whatsappText: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqConfig {
  enabled: boolean;
  heading: string;
  headingHighlight: string;
  items: FaqItem[];
}

export interface LocationConfig {
  enabled: boolean;
  heading: string;
  headingHighlight: string;
  /** Address text shown beside the map. Falls back to contact.location. */
  address: string;
  /** A Google Maps embed URL, a pasted <iframe> embed, or a plain place/address
   *  we turn into an embed. Blank + blank address hides the section. */
  mapsEmbedUrl: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
}

export interface TeamConfig {
  enabled: boolean;
  heading: string;
  headingHighlight: string;
  subheading: string;
  members: TeamMember[];
  /** Slowly auto-advance the carousel. Pauses on hover/touch. Default on. */
  autoScroll?: boolean;
}

export interface BookingSlot {
  id: string;
  /** Shown to the customer, e.g. "Morning · 8–11 am". */
  label: string;
  /** 24-hour local start/end, "HH:MM". These decide what actually overlaps:
   *  a morning booking must not block the evening, but a full-day one should
   *  block both. */
  start: string;
  end: string;
}

export interface BookingConfig {
  enabled: boolean;
  /** Percentage of the package price taken up front. */
  advancePercent: number;
  /** When false, single-day bookings skip slot selection and book the whole
   *  day (for shoots like weddings that aren't slot-based). Default true. */
  slotsEnabled?: boolean;
  slots: BookingSlot[];
  /** Weekdays the studio works. 0 = Sunday. */
  workingDays: number[];
  /** ISO dates (YYYY-MM-DD) that are fully unavailable. */
  blackoutDates: string[];
  /** Earliest bookable date, in days from today. */
  leadTimeDays: number;
  /** How long a chosen slot is held while the customer finishes booking. */
  holdMinutes: number;
  termsText: string;
  confirmationText: string;
}

/** Keys the admin can reorder. Header, hero and footer are fixed. */
export type HomeSectionKey =
  | "services"
  | "howItWorks"
  | "work"
  | "packages"
  | "about"
  | "reviews"
  | "bookBand"
  | "faq"
  | "team"
  | "location";

export interface SiteConfig {
  hero: HeroConfig;
  categories: CategoryConfig[];
  contact: ContactConfig;
  form: FormConfig;
  redirections: RedirectionsConfig;
  branding: BrandingConfig;
  sectionStyles: Record<SectionId, SectionStyleConfig>;
  themePresets: ThemePreset[];
  activeThemeId: string;
  /** Custom theme colors (hex). Keys = CSS var names without --. Override preset when set. */
  customThemeColors?: CustomThemeColors;

  /* Home page sections */
  nav: NavConfig;
  /** Short reassurance lines under the hero buttons, e.g. "500+ shoots". */
  heroTrustBadges: string[];
  servicesHeading: string;
  servicesHeadingHighlight: string;
  servicesSubheading: string;
  howItWorks: HowItWorksConfig;
  work: WorkConfig;
  packages: PackagesConfig;
  about: AboutConfig;
  reviews: ReviewsConfig;
  bookBand: BookBandConfig;
  faq: FaqConfig;
  team: TeamConfig;
  location: LocationConfig;
  booking: BookingConfig;
  sectionOrder: HomeSectionKey[];
}
