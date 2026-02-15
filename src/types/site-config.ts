export interface CategoryConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  thumbnailUrl: string;
  media: MediaItem[];
}

export interface MediaItem {
  id: string;
  type: "photo" | "video";
  url: string;
  caption?: string;
}

/** For select type: "categories" = use site categories, "budget" = use form budget options, "custom" = use field.options */
export type FormFieldOptionsSource = "categories" | "budget" | "custom";

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

export interface HeroConfig {
  backgroundImageUrl: string;
  tagline: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  ctaBookText: string;
  ctaWhatsAppText: string;
}

export interface ContactConfig {
  whatsappNumber: string;
  email: string;
  location: string;
  footerBrandName: string;
  footerTagline: string;
  footerCopyrightPrefix: string;
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
}
