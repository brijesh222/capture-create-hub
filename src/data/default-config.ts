import type { SiteConfig } from "@/types/site-config";

/* ---------------------------------------------------------------------------
 * Home page section defaults
 *
 * Copy here is placeholder written to match the approved design. Prices,
 * delivery times and the About text all need the studio's real answers
 * before launch.
 * ------------------------------------------------------------------------- */

type HomeSections = Pick<
  SiteConfig,
  | "nav"
  | "heroTrustBadges"
  | "servicesHeading"
  | "servicesHeadingHighlight"
  | "servicesSubheading"
  | "howItWorks"
  | "work"
  | "packages"
  | "about"
  | "reviews"
  | "bookBand"
  | "faq"
  | "team"
  | "location"
  | "booking"
  | "sectionOrder"
>;

export const defaultHomeSections: HomeSections = {
  nav: {
    links: [
      { id: "n1", label: "Work", href: "#work" },
      { id: "n2", label: "Services", href: "#services" },
      { id: "n3", label: "Pricing", href: "#packages" },
      { id: "n4", label: "About", href: "#about" },
    ],
    ctaText: "Book a shoot",
  },
  heroTrustBadges: ["500+ shoots", "Travel across India", "Delivery in 3 weeks"],
  servicesHeading: "What we ",
  servicesHeadingHighlight: "shoot",
  servicesSubheading:
    "Pick a service to see the full gallery, packages and available dates.",
  howItWorks: {
    enabled: true,
    heading: "Booking takes about ",
    headingHighlight: "two minutes",
    steps: [
      {
        id: "s1",
        title: "Pick your date",
        body: "See exactly which dates are free and choose the one you want. No waiting for a reply.",
      },
      {
        id: "s2",
        title: "Confirm the booking",
        body: "Share a few details and pay the advance to lock the date. The rest is due after the shoot.",
      },
      {
        id: "s3",
        title: "We shoot and deliver",
        body: "We arrive early, shoot the day, and send your edited gallery within three weeks.",
      },
    ],
  },
  work: {
    enabled: true,
    heading: "Recent ",
    headingHighlight: "work",
    subheading: "A few frames from the last few months.",
    photos: [],
    ctaText: "See the full gallery",
    ctaHref: "#services",
  },
  packages: {
    enabled: true,
    heading: "Simple, ",
    headingHighlight: "honest pricing",
    subheading:
      "Wedding packages shown here. Every service has its own — no hidden costs, no surprises.",
    items: [
      {
        id: "p1", serviceSlug: "wedding",
        name: "Essential", price: "₹45,000", priceNote: "one day · 8 hours",
        features: ["One photographer", "250+ edited photos", "Online gallery", "Delivery in 3 weeks"],
        featured: false, tag: "", ctaText: "Check dates",
      },
      {
        id: "p2", serviceSlug: "wedding",
        name: "Complete", price: "₹85,000", priceNote: "two days · full event",
        features: ["Two photographers", "500+ edited photos", "Highlight reel for Instagram", "Printed 30-page album", "Delivery in 3 weeks"],
        featured: true, tag: "Most booked", ctaText: "Check dates",
      },
      {
        id: "p3", serviceSlug: "wedding",
        name: "Signature", price: "₹1,40,000", priceNote: "all functions",
        features: ["Full team with video", "800+ edited photos", "Cinematic wedding film", "Two premium albums", "Drone coverage"],
        featured: false, tag: "", ctaText: "Check dates",
      },
      {
        id: "pw1", serviceSlug: "pre-wedding",
        name: "Half Day", price: "₹25,000", priceNote: "4 hours · one location",
        features: ["One photographer", "80+ edited photos", "Two outfit changes", "Online gallery"],
        featured: false, tag: "", ctaText: "Check dates",
      },
      {
        id: "pw2", serviceSlug: "pre-wedding",
        name: "Full Day", price: "₹40,000", priceNote: "8 hours · two locations",
        features: ["One photographer", "150+ edited photos", "Unlimited outfit changes", "Reel for Instagram", "Online gallery"],
        featured: true, tag: "Most booked", ctaText: "Check dates",
      },
      {
        id: "mt1", serviceSlug: "maternity",
        name: "Studio", price: "₹15,000", priceNote: "2 hours · indoor",
        features: ["60+ edited photos", "Two outfit changes", "Props included", "Online gallery"],
        featured: true, tag: "Most booked", ctaText: "Check dates",
      },
      {
        id: "mt2", serviceSlug: "maternity",
        name: "Outdoor", price: "₹22,000", priceNote: "3 hours · location of choice",
        features: ["100+ edited photos", "Golden-hour session", "Partner and family shots", "Online gallery"],
        featured: false, tag: "", ctaText: "Check dates",
      },
      {
        id: "bd1", serviceSlug: "birthday",
        name: "Newborn Session", price: "₹12,000", priceNote: "2-3 hours · at your home",
        features: ["50+ edited photos", "We work around the baby", "Props and wraps included", "Online gallery"],
        featured: true, tag: "Most booked", ctaText: "Check dates",
      },
      {
        id: "bd2", serviceSlug: "birthday",
        name: "Birthday Party", price: "₹18,000", priceNote: "4 hours · full event",
        features: ["150+ edited photos", "Candid and posed coverage", "Decor and cake detail shots", "Online gallery"],
        featured: false, tag: "", ctaText: "Check dates",
      },
    ],
  },
  about: {
    enabled: true,
    heading: "Hi, I'm ",
    headingHighlight: "Brijesh",
    photoUrl: "",
    paragraphs: [
      "I've been photographing weddings and families across Rajasthan since 2019. I shoot quietly — you won't find me arranging people into poses all day. The moments worth keeping usually happen while nobody is looking.",
      "Every photo you receive is edited by me personally. No outsourcing, no filters you didn't ask for.",
    ],
    stats: [
      { id: "st1", value: "500+", label: "Shoots completed" },
      { id: "st2", value: "7", label: "Years shooting" },
      { id: "st3", value: "3 wks", label: "Average delivery" },
    ],
  },
  reviews: {
    enabled: true,
    heading: "What couples ",
    headingHighlight: "say",
    items: [
      {
        id: "r1", serviceSlug: "wedding",
        name: "Anjali & Siddharth",
        meta: "Wedding · Udaipur",
        rating: 5,
        text: "He caught my grandmother laughing during the pheras — nobody else even noticed it happened. That photo is framed in our living room now.",
      },
      {
        id: "r2", serviceSlug: "maternity",
        name: "Meera Kulkarni",
        meta: "Maternity · Jaipur",
        rating: 5,
        text: "Booked on a Tuesday, shot that Sunday. Photos arrived before the date he promised. Genuinely the easiest part of the whole wedding.",
      },
      {
        id: "r3", serviceSlug: "birthday",
        name: "Rohit & Priya",
        meta: "Newborn · Jodhpur",
        rating: 5,
        text: "Our baby cried for the first forty minutes. Brijesh just waited, drank chai with my mother, and then got the shots. Endless patience.",
      },
    ],
  },
  bookBand: {
    enabled: true,
    eyebrow: "Available now",
    heading: "Let's get your date ",
    headingHighlight: "locked in",
    body: "Check which dates are free and book in about two minutes. Prefer to talk it through first? Message us on WhatsApp — we usually reply within an hour.",
    primaryText: "Check available dates",
    whatsappText: "WhatsApp us",
  },
  faq: {
    enabled: true,
    heading: "Common ",
    headingHighlight: "questions",
    items: [
      {
        id: "q1",
        question: "How much advance do I need to pay?",
        answer: "25% of the package locks your date. The rest is due on the day of the shoot.",
      },
      {
        id: "q2",
        question: "Do you travel outside Rajasthan?",
        answer: "Yes, anywhere in India. Travel and stay are added at actual cost — no markup.",
      },
      {
        id: "q3",
        question: "When do we get our photos?",
        answer:
          "Within three weeks of the shoot. If you need a few images sooner — for a reception or a social post — just ask and we'll send a preview set within 48 hours.",
      },
      {
        id: "q4",
        question: "Do we get the unedited photos?",
        answer:
          "Edited photos only. Raw files aren't representative of the finished work, so we prefer to be judged on what we deliver.",
      },
      {
        id: "q5",
        question: "What if we need to change the date?",
        answer:
          "You can move your booking to any available date at no extra cost — just let us know as early as you can. The advance itself is non-refundable.",
      },
    ],
  },
  team: {
    enabled: false,
    heading: "Meet the ",
    headingHighlight: "team",
    subheading: "The people behind the camera.",
    autoScroll: true,
    members: [
      { id: "tm1", name: "Brijesh Prajapat", role: "Lead photographer", photoUrl: "" },
    ],
  },
  location: {
    enabled: false,
    heading: "Find ",
    headingHighlight: "us",
    address: "Jaipur, Rajasthan",
    mapsEmbedUrl: "",
  },
  booking: {
    enabled: true,
    advancePercent: 10,
    slotsEnabled: true,
    slots: [
      { id: "morning", label: "Morning · 8–11 am", start: "08:00", end: "11:00" },
      { id: "afternoon", label: "Afternoon · 12–3 pm", start: "12:00", end: "15:00" },
      { id: "evening", label: "Evening · 4–7 pm", start: "16:00", end: "19:00" },
      // Deliberately spans the others, so booking a full day blocks them all.
      { id: "fullday", label: "Full day", start: "08:00", end: "19:00" },
    ],
    // Closed Mondays by default — the studio can change this.
    workingDays: [0, 2, 3, 4, 5, 6],
    blackoutDates: [],
    leadTimeDays: 2,
    holdMinutes: 15,
    termsText:
      "The 10% advance confirms your date and is non-refundable. You can reschedule to any available date at no extra cost. The balance is due on the day of the shoot.",
    confirmationText:
      "We've received your booking. Brijesh will message you on WhatsApp to confirm the date and share payment details.",
  },
  sectionOrder: [
    "services",
    "howItWorks",
    "work",
    "packages",
    "about",
    "team",
    "reviews",
    "bookBand",
    "faq",
    "location",
  ],
};

export const defaultSiteConfig: SiteConfig = {
  hero: {
    backgroundImageUrl: "",
    tagline: "Wedding & family photography",
    title: "Photographs your family will ",
    titleHighlight: "actually print",
    subtitle:
      "Weddings, maternity and newborn shoots across Rajasthan — unhurried on the day, edited by hand, delivered in three weeks.",
    ctaBookText: "Book a shoot",
    ctaWhatsAppText: "WhatsApp us",
    videoUrl: "",
    slides: [],
  },
  categories: [
    { id: "1", name: "Wedding", slug: "wedding", description: "Timeless moments of your special day", icon: "💍", thumbnailUrl: "", media: [], startingPrice: "from ₹45,000", visible: true, intro: "From the haldi to the last dance, we cover the whole day without asking you to pose for it. You get on with your wedding; we work around it.", included: ["Full-day coverage from getting ready to reception", "Two photographers on the Complete package and above", "Edited gallery you can share with family abroad", "Print-ready files at full resolution"], reassurance: ["We scout the venue before the day", "Backup cameras and backup storage, always", "Travel anywhere in India at actual cost"], faqItems: [{ id: "wedding-f1", question: "Do you cover multiple functions on different days?", answer: "Yes. The Signature package covers all functions. For two or three separate days we'll quote based on your schedule." }, { id: "wedding-f2", question: "Will you direct us, or stay in the background?", answer: "Mostly background. We'll guide you for family portraits and couple shots, and stay out of the way for everything else." }, { id: "wedding-f3", question: "How far in advance should we book?", answer: "Peak season dates in Rajasthan go 6-9 months ahead. Off-season, a month is usually enough." }], },
    { id: "2", name: "Pre Wedding", slug: "pre-wedding", description: "Romantic stories before the big day", icon: "💑", thumbnailUrl: "", media: [], startingPrice: "from ₹25,000", visible: true, intro: "A relaxed few hours before the wedding rush begins. Good for save-the-dates, invites, and the reel everyone asks for.", included: ["Location scouting and outfit advice beforehand", "Edited gallery within two weeks", "A short vertical reel cut for Instagram", "Full-resolution files for printing invites"], reassurance: ["We help pick locations and times for the best light", "Rescheduling is free if the weather turns"], faqItems: [{ id: "pre-wedding-f1", question: "How many outfit changes can we do?", answer: "Two on the half-day, unlimited on the full day. We'll help plan the order so the light works for each." }, { id: "pre-wedding-f2", question: "Can we shoot in more than one place?", answer: "Yes, two locations on the full-day package. We factor travel time into the schedule." }, { id: "pre-wedding-f3", question: "How soon do we get the photos?", answer: "Within two weeks — faster than weddings, since there's less to edit." }], },
    { id: "3", name: "Birthday", slug: "birthday", description: "Celebrate life's joyful milestones", icon: "🎂", thumbnailUrl: "", media: [], startingPrice: "from ₹12,000", visible: true, intro: "Newborn sessions at your home, and birthday parties wherever they happen. Both need patience more than they need lighting.", included: ["We come to you for newborn sessions", "Props, wraps and baskets included", "50+ hand-edited photos", "Family and sibling shots included"], reassurance: ["We work around feeding and sleeping — no rushing", "Sessions can run long at no extra charge", "Everything is sanitised before we handle the baby"], faqItems: [{ id: "birthday-f1", question: "How old should the baby be?", answer: "Between 5 and 14 days for the sleepy curled-up shots. Older is fine too, it's just a different kind of session." }, { id: "birthday-f2", question: "What if the baby won't settle?", answer: "That's normal and we plan for it. Sessions are booked with extra time built in, and we've never left without the shots." }, { id: "birthday-f3", question: "Do you come to our home?", answer: "Yes for newborn sessions — babies settle better somewhere familiar." }], },
    { id: "4", name: "Maternity", slug: "maternity", description: "Beautiful journey of motherhood", icon: "🤰", thumbnailUrl: "", media: [], startingPrice: "from ₹15,000", visible: true, intro: "Calm, unhurried sessions in the last trimester. Most people feel awkward for the first ten minutes and forget the camera after that.", included: ["Outfit and styling guidance before the session", "Props, wraps and backdrops provided", "60+ hand-edited photos", "Partner and sibling shots at no extra cost"], reassurance: ["Sessions are paced around how you're feeling on the day", "Rescheduling is free if you're unwell", "Studio is private — nobody else is around"], faqItems: [{ id: "maternity-f1", question: "When in my pregnancy should I book?", answer: "Between 28 and 34 weeks works best. Book earlier and hold the date — we'll move it if the baby has other plans." }, { id: "maternity-f2", question: "What should I wear?", answer: "We'll send a guide once you book, and there are wraps and gowns at the studio if you'd rather not shop." }, { id: "maternity-f3", question: "Can my partner and other children join?", answer: "Yes, and it's included. Just tell us beforehand so we plan the time." }], },
    { id: "5", name: "Business Promo", slug: "business-promo", description: "Elevate your brand presence", icon: "💼", thumbnailUrl: "", media: [], startingPrice: "from ₹20,000", visible: true },
    { id: "6", name: "Hotel / Resort / Interior", slug: "hotel-resort-interior", description: "Stunning architectural & hospitality shoots", icon: "🏨", thumbnailUrl: "", media: [], startingPrice: "from ₹18,000", visible: true },
    { id: "7", name: "Product", slug: "product", description: "Showcase your products beautifully", icon: "📦", thumbnailUrl: "", media: [], startingPrice: "from ₹8,000", visible: true },
    { id: "8", name: "Food", slug: "food", description: "Mouth-watering culinary visuals", icon: "🍽️", thumbnailUrl: "", media: [], startingPrice: "from ₹8,000", visible: true },
  ],
  contact: {
    whatsappNumber: "917023433374",
    email: "hello@duskangle.in",
    location: "Jaipur, Rajasthan",
    footerBrandName: "Dusk Angle",
    footerTagline: "Premium photography & videography services. Capturing moments that last forever.",
    footerCopyrightPrefix: "Dusk Angle",
    instagram: "duskangle.in",
    website: "www.duskangle.com",
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
      { id: "f5", key: "package", label: "Choose your package", placeholder: "Select a package", type: "select", required: false, optionsSource: "packages" },
      { id: "f6", key: "preferredDate", label: "Preferred Date", placeholder: "", type: "date", required: false },
      { id: "f7", key: "message", label: "Message", placeholder: "Tell us more about your vision...", type: "textarea", required: false },
    ],
  },
  redirections: {
    whatsappLink: "https://wa.me/917023433374",
    bookNowRedirectUrl: "",
  },
  branding: {
    siteName: "Dusk Angle",
    logoUrl: "",
    documentTitle: "Dusk Angle | Photography & Videography",
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
      name: "Studio (Deep Green)",
      cssVars: {
        "--primary": "162 40% 23%",
        "--primary-foreground": "36 18% 97%",
        "--accent": "140 16% 93%",
        "--accent-foreground": "162 40% 23%",
        "--secondary": "140 16% 93%",
        "--secondary-foreground": "162 40% 23%",
        "--ring": "162 40% 23%",
        "--gold": "162 40% 23%",
        "--gold-light": "162 32% 34%",
        "--gold-dark": "162 45% 17%",
        "--border": "36 16% 87%",
      },
    },
    {
      id: "ink",
      name: "Ink (Black & Paper)",
      cssVars: {
        "--primary": "252 11% 12%",
        "--primary-foreground": "36 18% 97%",
        "--accent": "36 14% 91%",
        "--accent-foreground": "252 11% 12%",
        "--secondary": "36 14% 91%",
        "--secondary-foreground": "252 11% 12%",
        "--ring": "252 11% 12%",
        "--gold": "252 11% 12%",
        "--gold-light": "252 8% 28%",
        "--gold-dark": "252 14% 7%",
        "--border": "36 16% 87%",
      },
    },
    {
      id: "plum",
      name: "Plum (Deep Aubergine)",
      cssVars: {
        "--primary": "320 32% 26%",
        "--primary-foreground": "36 18% 97%",
        "--accent": "320 20% 93%",
        "--accent-foreground": "320 32% 26%",
        "--secondary": "320 20% 93%",
        "--secondary-foreground": "320 32% 26%",
        "--ring": "320 32% 26%",
        "--gold": "320 32% 26%",
        "--gold-light": "320 24% 38%",
        "--gold-dark": "320 36% 18%",
        "--border": "330 14% 88%",
      },
    },
    {
      id: "monsoon",
      name: "Monsoon (Deep Teal Blue)",
      cssVars: {
        "--primary": "199 44% 24%",
        "--primary-foreground": "36 18% 97%",
        "--accent": "199 24% 92%",
        "--accent-foreground": "199 44% 24%",
        "--secondary": "199 24% 92%",
        "--secondary-foreground": "199 44% 24%",
        "--ring": "199 44% 24%",
        "--gold": "199 44% 24%",
        "--gold-light": "199 34% 36%",
        "--gold-dark": "199 48% 17%",
        "--border": "205 16% 88%",
      },
    },
    {
      id: "rose",
      name: "Pink (Maternity)",
      cssVars: {
        "--primary": "338 44% 44%",
        "--primary-foreground": "36 18% 98%",
        "--accent": "338 34% 94%",
        "--accent-foreground": "338 44% 30%",
        "--secondary": "338 34% 94%",
        "--secondary-foreground": "338 44% 30%",
        "--ring": "338 44% 44%",
        "--gold": "338 44% 44%",
        "--gold-light": "338 40% 56%",
        "--gold-dark": "338 48% 34%",
        "--border": "335 24% 89%",
      },
    },
    {
      id: "festive",
      name: "Orange (Festive / Wedding)",
      cssVars: {
        "--primary": "22 68% 46%",
        "--primary-foreground": "36 18% 98%",
        "--accent": "28 48% 93%",
        "--accent-foreground": "22 68% 32%",
        "--secondary": "28 48% 93%",
        "--secondary-foreground": "22 68% 32%",
        "--ring": "22 68% 46%",
        "--gold": "22 68% 46%",
        "--gold-light": "28 66% 56%",
        "--gold-dark": "20 70% 36%",
        "--border": "30 30% 88%",
      },
    },
    {
      id: "royal",
      name: "Purple (Premium)",
      cssVars: {
        "--primary": "268 34% 41%",
        "--primary-foreground": "36 18% 98%",
        "--accent": "268 26% 93%",
        "--accent-foreground": "268 34% 28%",
        "--secondary": "268 26% 93%",
        "--secondary-foreground": "268 34% 28%",
        "--ring": "268 34% 41%",
        "--gold": "268 34% 41%",
        "--gold-light": "268 32% 53%",
        "--gold-dark": "268 38% 31%",
        "--border": "270 20% 89%",
      },
    },
  ],
  ...defaultHomeSections,
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
    // Fold the old single "cover video" into the carousel slides so it shows in
    // the hero (the carousel takes priority over the single video). One place for
    // images and videos now.
    hero: (() => {
      const base = { ...defaultSiteConfig.hero, ...partial.hero };
      const slides = base.slides ?? [];
      if (
        base.videoUrl &&
        !slides.some((s) => s.type === "video" && s.url === base.videoUrl)
      ) {
        return {
          ...base,
          slides: [
            { id: "hero-video", type: "video" as const, url: base.videoUrl },
            ...slides,
          ],
          videoUrl: "",
        };
      }
      return { ...base, slides };
    })(),
    // Each saved category merges with *its own* default, matched by id or slug.
    // Using categories[0] as the base made every category inherit Wedding's
    // copy for any field the saved config predated.
    categories: partial.categories?.length
      ? partial.categories.map((c) => {
          const base = defaultSiteConfig.categories.find(
            (d) => d.id === c.id || d.slug === c.slug
          );
          // Fold the old single videoUrl into the new videos list so configs
          // saved before multi-video keep showing their video.
          const videos = c.videos?.length
            ? c.videos
            : c.videoUrl
              ? [c.videoUrl]
              : [];
          return { ...base, ...c, media: c.media ?? [], videos };
        })
      : defaultSiteConfig.categories,
    contact: { ...defaultSiteConfig.contact, ...partial.contact },
    form: {
      ...defaultSiteConfig.form,
      ...partial.form,
      fields: (partial.form?.fields?.length
        ? partial.form.fields
        : defaultSiteConfig.form.fields
      ).map((f, i) => {
        const field = {
          ...f,
          id: (f as { id?: string }).id || `f-${i}`,
          options: (f as { options?: string[] }).options ?? [],
        };
        // Budget ranges were replaced by real package selection. Upgrade the
        // saved field in place so existing configs pick up the new behaviour
        // instead of keeping a dropdown that no longer matches the site.
        if (field.optionsSource === "budget") {
          return {
            ...field,
            key: "package",
            label: "Choose your package",
            placeholder: "Select a package",
            optionsSource: "packages" as const,
          };
        }
        return field;
      }),
      budgetOptions: partial.form?.budgetOptions?.length ? partial.form.budgetOptions : defaultSiteConfig.form.budgetOptions,
    },
    redirections: { ...defaultSiteConfig.redirections, ...partial.redirections },
    branding: { ...defaultSiteConfig.branding, ...partial.branding },
    sectionStyles: { ...defaultSiteConfig.sectionStyles, ...partial.sectionStyles },
    // Always the shipped set: the admin selects a preset but never edits one,
    // so a config saved before a retheme must not pin the old palette.
    themePresets: defaultSiteConfig.themePresets,
    activeThemeId: partial.activeThemeId ?? defaultSiteConfig.activeThemeId,
    customThemeColors: { ...defaultSiteConfig.customThemeColors, ...partial.customThemeColors },

    /* Home page sections. Lists fall back to defaults when absent or empty so
       a config saved before these existed still renders a complete page. */
    nav: {
      ...defaultHomeSections.nav,
      ...partial.nav,
      links: partial.nav?.links?.length ? partial.nav.links : defaultHomeSections.nav.links,
    },
    heroTrustBadges: partial.heroTrustBadges?.length
      ? partial.heroTrustBadges
      : defaultHomeSections.heroTrustBadges,
    servicesHeading: partial.servicesHeading ?? defaultHomeSections.servicesHeading,
    servicesHeadingHighlight:
      partial.servicesHeadingHighlight ?? defaultHomeSections.servicesHeadingHighlight,
    servicesSubheading: partial.servicesSubheading ?? defaultHomeSections.servicesSubheading,
    howItWorks: {
      ...defaultHomeSections.howItWorks,
      ...partial.howItWorks,
      steps: partial.howItWorks?.steps?.length
        ? partial.howItWorks.steps
        : defaultHomeSections.howItWorks.steps,
    },
    work: {
      ...defaultHomeSections.work,
      ...partial.work,
      photos: partial.work?.photos ?? defaultHomeSections.work.photos,
    },
    packages: {
      ...defaultHomeSections.packages,
      ...partial.packages,
      items: partial.packages?.items?.length
        ? partial.packages.items
        : defaultHomeSections.packages.items,
    },
    about: {
      ...defaultHomeSections.about,
      ...partial.about,
      paragraphs: partial.about?.paragraphs?.length
        ? partial.about.paragraphs
        : defaultHomeSections.about.paragraphs,
      stats: partial.about?.stats?.length ? partial.about.stats : defaultHomeSections.about.stats,
    },
    reviews: {
      ...defaultHomeSections.reviews,
      ...partial.reviews,
      items: partial.reviews?.items ?? defaultHomeSections.reviews.items,
    },
    bookBand: { ...defaultHomeSections.bookBand, ...partial.bookBand },
    faq: {
      ...defaultHomeSections.faq,
      ...partial.faq,
      items: partial.faq?.items?.length ? partial.faq.items : defaultHomeSections.faq.items,
    },
    team: {
      ...defaultHomeSections.team,
      ...partial.team,
      members: partial.team?.members?.length
        ? partial.team.members
        : defaultHomeSections.team.members,
    },
    location: { ...defaultHomeSections.location, ...partial.location },
    booking: {
      ...defaultHomeSections.booking,
      ...partial.booking,
      // Merge each saved slot with its default by id, so slots stored before
      // start/end times existed still get them. Keeping the saved object as-is
      // left `start` undefined and crashed the overlap check.
      slots: partial.booking?.slots?.length
        ? partial.booking.slots.map((slot) => {
            const base = defaultHomeSections.booking.slots.find(
              (d) => d.id === slot.id
            );
            return { ...base, ...slot, start: slot.start ?? base?.start ?? "08:00", end: slot.end ?? base?.end ?? "19:00" };
          })
        : defaultHomeSections.booking.slots,
      workingDays: partial.booking?.workingDays?.length
        ? partial.booking.workingDays
        : defaultHomeSections.booking.workingDays,
      blackoutDates: partial.booking?.blackoutDates ?? defaultHomeSections.booking.blackoutDates,
    },
    // Keep the saved order, but slot any newly-added sections (e.g. "team") in
    // at their default position — after the section they follow in the defaults
    // — rather than dumping them at the end.
    sectionOrder: partial.sectionOrder?.length
      ? mergeSectionOrder(partial.sectionOrder)
      : defaultHomeSections.sectionOrder,
  };
}

/** Merge a saved order with the defaults, inserting missing sections by their
 *  default adjacency so a new section lands where it was designed to. */
function mergeSectionOrder(saved: SiteConfig["sectionOrder"]): SiteConfig["sectionOrder"] {
  const result = [...saved];
  const def = defaultHomeSections.sectionOrder;
  def.forEach((key, i) => {
    if (result.includes(key)) return;
    // Find the nearest earlier default section that's already in the result,
    // and insert right after it; otherwise put it at the front.
    let insertAt = 0;
    for (let j = i - 1; j >= 0; j--) {
      const idx = result.indexOf(def[j]);
      if (idx !== -1) {
        insertAt = idx + 1;
        break;
      }
    }
    result.splice(insertAt, 0, key);
  });
  return result;
}
