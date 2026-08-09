import { useState } from "react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import AdminServices from "./AdminServices";
import { SectionCard, TextField, TextArea, ImageField, ListEditor } from "@/components/admin/fields";
import type { HomeSectionKey } from "@/types/site-config";

const uid = () => Math.random().toString(36).slice(2, 9);

/** Section titles for the reorder list. */
const SECTION_TITLES: Record<HomeSectionKey, string> = {
  services: "Services",
  howItWorks: "How it works",
  work: "Recent work",
  packages: "Packages",
  about: "About",
  reviews: "Reviews",
  bookBand: "Booking band",
  faq: "FAQ",
  team: "Team",
  location: "Location",
};

/**
 * Edit every part of the home page. Each section is a card; changes flow
 * straight into the shared config and go live when the admin hits Save in the
 * header. A live preview link sits at the top.
 */
const AdminContent = () => {
  const { config, updateConfig } = useSiteConfig();
  const [view, setView] = useState<"home" | "services">("home");

  // Small helpers so each editor reads cleanly.
  const patch = <K extends keyof typeof config>(key: K, value: Partial<(typeof config)[K]>) =>
    updateConfig(key, { ...(config[key] as object), ...value } as (typeof config)[K]);

  const moveSection = (i: number, dir: -1 | 1) => {
    const order = [...config.sectionOrder];
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    updateConfig("sectionOrder", order);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-light tracking-[-0.028em]">Home page</h1>
          <p className="text-sm text-muted-foreground">
            Edit any section, then hit Save. Changes go live for everyone.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full border border-border px-4 py-2 text-[0.85rem] font-medium hover:border-foreground"
        >
          View site ↗
        </a>
      </div>

      <div className="mb-4 flex gap-1.5">
        {(["home", "services"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={
              "rounded-full px-4 py-1.5 text-[0.85rem] font-medium transition-colors " +
              (view === v
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:border-foreground")
            }
          >
            {v === "home" ? "Home page" : "Service pages"}
          </button>
        ))}
      </div>

      {view === "services" ? <AdminServices /> : null}

      {view === "home" ? (
      <div className="flex flex-col gap-3">
        {/* ---------------- Header / nav ---------------- */}
        <SectionCard title="Header" subtitle="Logo, menu links, book button" defaultOpen>
          <ImageField
            label="Logo image (optional)"
            value={config.branding.logoUrl}
            onChange={(v) => patch("branding", { logoUrl: v })}
            hint="Leave blank to show the site name as text."
          />
          <TextField
            label="Site name"
            value={config.branding.siteName}
            onChange={(v) => patch("branding", { siteName: v })}
          />
          <TextField
            label="Book button text"
            value={config.nav.ctaText}
            onChange={(v) => patch("nav", { ctaText: v })}
          />
          <div>
            <span className="mb-1 block text-[0.82rem] font-medium">Menu links</span>
            <ListEditor
              items={config.nav.links}
              onChange={(links) => patch("nav", { links })}
              makeNew={() => ({ id: uid(), label: "New link", href: "#" })}
              addLabel="Add link"
              renderItem={(link, update) => (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]"
                    value={link.label}
                    placeholder="Label"
                    onChange={(e) => update({ label: e.target.value })}
                  />
                  <input
                    className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]"
                    value={link.href}
                    placeholder="#services"
                    onChange={(e) => update({ href: e.target.value })}
                  />
                </div>
              )}
            />
          </div>
        </SectionCard>

        {/* ---------------- Hero ---------------- */}
        <SectionCard title="Banner" subtitle="The first screen">
          <ImageField
            label="Cover photo"
            value={config.hero.backgroundImageUrl}
            onChange={(v) => patch("hero", { backgroundImageUrl: v })}
          />
          <TextField
            label="Cover video (YouTube URL)"
            value={config.hero.videoUrl ?? ""}
            onChange={(v) => patch("hero", { videoUrl: v })}
            placeholder="https://youtu.be/…"
            hint="Optional. When set, a silent looping video fills the cover slot instead of the photo (same shape)."
          />
          <div>
            <span className="mb-1 block text-[0.82rem] font-medium">Banner carousel (images &amp; videos)</span>
            <ListEditor
              items={config.hero.slides ?? []}
              onChange={(slides) => patch("hero", { slides })}
              makeNew={() => ({ id: uid(), type: "image" as const, url: "" })}
              addLabel="Add slide"
              renderItem={(s, u) => (
                <div className="flex flex-col gap-2">
                  <select className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={s.type} onChange={(e) => u({ type: e.target.value as "image" | "video" })}>
                    <option value="image">Image</option>
                    <option value="video">Video (YouTube)</option>
                  </select>
                  {s.type === "video" ? (
                    <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={s.url} placeholder="https://youtu.be/…" onChange={(e) => u({ url: e.target.value })} />
                  ) : (
                    <ImageField label="" value={s.url} onChange={(v) => u({ url: v })} />
                  )}
                </div>
              )}
            />
            <p className="mt-1 text-[0.75rem] text-muted-foreground">
              Add slides to turn the banner into a swipeable, auto-playing carousel. Each slide fills the same frame. Leave empty to use the single cover above.
            </p>
          </div>
          <TextField label="Eyebrow" value={config.hero.tagline} onChange={(v) => patch("hero", { tagline: v })} />
          <TextField label="Headline" value={config.hero.title} onChange={(v) => patch("hero", { title: v })} />
          <TextField label="Headline highlight" value={config.hero.titleHighlight} onChange={(v) => patch("hero", { titleHighlight: v })} hint="Shown in the accent colour." />
          <TextArea label="Subtext" value={config.hero.subtitle} onChange={(v) => patch("hero", { subtitle: v })} />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Main button" value={config.hero.ctaBookText} onChange={(v) => patch("hero", { ctaBookText: v })} />
            <TextField label="WhatsApp button" value={config.hero.ctaWhatsAppText} onChange={(v) => patch("hero", { ctaWhatsAppText: v })} />
          </div>
          <div>
            <span className="mb-1 block text-[0.82rem] font-medium">Trust badges</span>
            <ListEditor
              items={config.heroTrustBadges.map((t) => ({ text: t }))}
              onChange={(rows) => updateConfig("heroTrustBadges", rows.map((r) => r.text))}
              makeNew={() => ({ text: "New badge" })}
              addLabel="Add badge"
              renderItem={(row, update) => (
                <input
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]"
                  value={row.text}
                  onChange={(e) => update({ text: e.target.value })}
                />
              )}
            />
          </div>
        </SectionCard>

        {/* ---------------- Services heading ---------------- */}
        <SectionCard title="Services heading" subtitle="Text above the service cards">
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Heading" value={config.servicesHeading} onChange={(v) => updateConfig("servicesHeading", v)} />
            <TextField label="Highlight" value={config.servicesHeadingHighlight} onChange={(v) => updateConfig("servicesHeadingHighlight", v)} />
          </div>
          <TextArea label="Subheading" value={config.servicesSubheading} onChange={(v) => updateConfig("servicesSubheading", v)} />
          <p className="text-[0.78rem] text-muted-foreground">
            The service cards themselves (name, photo, price) are edited under Services below.
          </p>
        </SectionCard>

        {/* ---------------- How it works ---------------- */}
        <SectionCard
          title="How it works"
          subtitle="The three steps"
          enabled={config.howItWorks.enabled}
          onToggle={(v) => patch("howItWorks", { enabled: v })}
        >
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Heading" value={config.howItWorks.heading} onChange={(v) => patch("howItWorks", { heading: v })} />
            <TextField label="Highlight" value={config.howItWorks.headingHighlight} onChange={(v) => patch("howItWorks", { headingHighlight: v })} />
          </div>
          <ListEditor
            items={config.howItWorks.steps}
            onChange={(steps) => patch("howItWorks", { steps })}
            makeNew={() => ({ id: uid(), title: "New step", body: "" })}
            addLabel="Add step"
            renderItem={(step, update) => (
              <div className="flex flex-col gap-2">
                <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem] font-medium" value={step.title} placeholder="Step title" onChange={(e) => update({ title: e.target.value })} />
                <textarea className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" rows={2} value={step.body} placeholder="Step description" onChange={(e) => update({ body: e.target.value })} />
              </div>
            )}
          />
        </SectionCard>

        {/* ---------------- Recent work ---------------- */}
        <SectionCard
          title="Recent work"
          subtitle="The home page photo grid"
          enabled={config.work.enabled}
          onToggle={(v) => patch("work", { enabled: v })}
        >
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Heading" value={config.work.heading} onChange={(v) => patch("work", { heading: v })} />
            <TextField label="Highlight" value={config.work.headingHighlight} onChange={(v) => patch("work", { headingHighlight: v })} />
          </div>
          <TextArea label="Subheading" value={config.work.subheading} onChange={(v) => patch("work", { subheading: v })} />
          <TextField
            label="Featured video (YouTube URL)"
            value={config.work.videoUrl ?? ""}
            onChange={(v) => patch("work", { videoUrl: v })}
            placeholder="https://youtu.be/…"
            hint="Paste any YouTube link — it shows as an embedded player above the photos. Blank hides it."
          />
          <div>
            <span className="mb-1 block text-[0.82rem] font-medium">Photos</span>
            <p className="mb-2 text-[0.75rem] text-muted-foreground">
              Leave empty to auto-show your service cover photos.
            </p>
            <ListEditor
              items={config.work.photos}
              onChange={(photos) => patch("work", { photos })}
              makeNew={() => ({ id: uid(), url: "", size: "normal" as const, caption: "" })}
              addLabel="Add photo"
              renderItem={(ph, u) => (
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-lg border border-border bg-muted bg-cover bg-center" style={ph.url ? { backgroundImage: `url(${ph.url})` } : undefined} />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={ph.url} placeholder="Photo URL (or upload below)" onChange={(e) => u({ url: e.target.value })} />
                    <div className="flex gap-2">
                      <input className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-[0.82rem]" value={ph.caption ?? ""} placeholder="Caption" onChange={(e) => u({ caption: e.target.value })} />
                      <select className="rounded-lg border border-border bg-card px-2 py-1.5 text-[0.82rem]" value={ph.size} onChange={(e) => u({ size: e.target.value as "normal" | "tall" })}>
                        <option value="normal">Normal</option>
                        <option value="tall">Tall</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
          <TextField label="Button text" value={config.work.ctaText} onChange={(v) => patch("work", { ctaText: v })} />
        </SectionCard>

        {/* ---------------- Packages ---------------- */}
        <SectionCard
          title="Packages"
          subtitle="Prices shown on the home page"
          enabled={config.packages.enabled}
          onToggle={(v) => patch("packages", { enabled: v })}
        >
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Heading" value={config.packages.heading} onChange={(v) => patch("packages", { heading: v })} />
            <TextField label="Highlight" value={config.packages.headingHighlight} onChange={(v) => patch("packages", { headingHighlight: v })} />
          </div>
          <TextArea label="Subheading" value={config.packages.subheading} onChange={(v) => patch("packages", { subheading: v })} />
          <p className="rounded-lg bg-muted px-3 py-2.5 text-[0.8rem] text-muted-foreground">
            The packages themselves are edited per service under{" "}
            <strong className="font-medium text-foreground">Service pages</strong>. This
            section shows them on the home page.
          </p>
          {false ? (
          <ListEditor
            items={config.packages.items}
            onChange={(items) => patch("packages", { items })}
            makeNew={() => ({ id: uid(), name: "New package", price: "₹0", priceNote: "", features: [], featured: false, tag: "", ctaText: "Check dates", serviceSlug: "" })}
            addLabel="Add package"
            renderItem={(pk, update) => (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem] font-medium" value={pk.name} placeholder="Name" onChange={(e) => update({ name: e.target.value })} />
                  <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={pk.price} placeholder="₹45,000" onChange={(e) => update({ price: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={pk.priceNote} placeholder="one day · 8 hours" onChange={(e) => update({ priceNote: e.target.value })} />
                  <select className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={pk.serviceSlug ?? ""} onChange={(e) => update({ serviceSlug: e.target.value } as never)}>
                    <option value="">Any service</option>
                    {config.categories.map((c) => (<option key={c.id} value={c.slug}>{c.name}</option>))}
                  </select>
                </div>
                <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={pk.features.join(", ")} placeholder="Features, comma separated" onChange={(e) => update({ features: e.target.value.split(",").map((f) => f.trim()).filter(Boolean) })} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={pk.tag} placeholder='Tag e.g. "Most booked"' onChange={(e) => update({ tag: e.target.value })} />
                  <label className="flex items-center gap-2 text-[0.82rem]">
                    <input type="checkbox" checked={pk.featured} onChange={(e) => update({ featured: e.target.checked })} />
                    Highlight this one
                  </label>
                </div>
              </div>
            )}
          />
          ) : null}
        </SectionCard>

        {/* ---------------- About ---------------- */}
        <SectionCard
          title="About"
          subtitle="Photographer bio and numbers"
          enabled={config.about.enabled}
          onToggle={(v) => patch("about", { enabled: v })}
        >
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Heading" value={config.about.heading} onChange={(v) => patch("about", { heading: v })} />
            <TextField label="Highlight" value={config.about.headingHighlight} onChange={(v) => patch("about", { headingHighlight: v })} />
          </div>
          <ImageField label="Photo" value={config.about.photoUrl} onChange={(v) => patch("about", { photoUrl: v })} />
          <ListEditor
            items={config.about.paragraphs.map((p) => ({ text: p }))}
            onChange={(rows) => patch("about", { paragraphs: rows.map((r) => r.text) })}
            makeNew={() => ({ text: "" })}
            addLabel="Add paragraph"
            renderItem={(row, update) => (
              <textarea className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" rows={2} value={row.text} onChange={(e) => update({ text: e.target.value })} />
            )}
          />
          <div>
            <span className="mb-1 block text-[0.82rem] font-medium">Numbers (e.g. 500+ shoots)</span>
            <ListEditor
              items={config.about.stats}
              onChange={(stats) => patch("about", { stats })}
              makeNew={() => ({ id: uid(), value: "", label: "" })}
              addLabel="Add number"
              renderItem={(st, update) => (
                <div className="grid grid-cols-2 gap-2">
                  <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem] font-medium" value={st.value} placeholder="500+" onChange={(e) => update({ value: e.target.value })} />
                  <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={st.label} placeholder="Shoots completed" onChange={(e) => update({ label: e.target.value })} />
                </div>
              )}
            />
          </div>
        </SectionCard>

        {/* ---------------- Book band ---------------- */}
        <SectionCard
          title="Booking band"
          subtitle="The 'let's book' prompt"
          enabled={config.bookBand.enabled}
          onToggle={(v) => patch("bookBand", { enabled: v })}
        >
          <TextField label="Eyebrow" value={config.bookBand.eyebrow} onChange={(v) => patch("bookBand", { eyebrow: v })} />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Heading" value={config.bookBand.heading} onChange={(v) => patch("bookBand", { heading: v })} />
            <TextField label="Highlight" value={config.bookBand.headingHighlight} onChange={(v) => patch("bookBand", { headingHighlight: v })} />
          </div>
          <TextArea label="Body" value={config.bookBand.body} onChange={(v) => patch("bookBand", { body: v })} />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Main button" value={config.bookBand.primaryText} onChange={(v) => patch("bookBand", { primaryText: v })} />
            <TextField label="WhatsApp button" value={config.bookBand.whatsappText} onChange={(v) => patch("bookBand", { whatsappText: v })} />
          </div>
        </SectionCard>

        {/* ---------------- Reviews ---------------- */}
        <SectionCard
          title="Reviews"
          subtitle="Heading — approve reviews in the Reviews tab"
          enabled={config.reviews.enabled}
          onToggle={(v) => patch("reviews", { enabled: v })}
        >
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Heading" value={config.reviews.heading} onChange={(v) => patch("reviews", { heading: v })} />
            <TextField label="Highlight" value={config.reviews.headingHighlight} onChange={(v) => patch("reviews", { headingHighlight: v })} />
          </div>
          <p className="rounded-lg bg-muted px-3 py-2.5 text-[0.8rem] text-muted-foreground">
            Customer reviews are approved in the{" "}
            <strong className="font-medium text-foreground">Reviews</strong> tab. Approved
            ones show here automatically.
          </p>
        </SectionCard>

        {/* ---------------- FAQ ---------------- */}
        <SectionCard
          title="FAQ"
          subtitle="Common questions"
          enabled={config.faq.enabled}
          onToggle={(v) => patch("faq", { enabled: v })}
        >
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Heading" value={config.faq.heading} onChange={(v) => patch("faq", { heading: v })} />
            <TextField label="Highlight" value={config.faq.headingHighlight} onChange={(v) => patch("faq", { headingHighlight: v })} />
          </div>
          <ListEditor
            items={config.faq.items}
            onChange={(items) => patch("faq", { items })}
            makeNew={() => ({ id: uid(), question: "", answer: "" })}
            addLabel="Add question"
            renderItem={(q, update) => (
              <div className="flex flex-col gap-2">
                <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem] font-medium" value={q.question} placeholder="Question" onChange={(e) => update({ question: e.target.value })} />
                <textarea className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" rows={2} value={q.answer} placeholder="Answer" onChange={(e) => update({ answer: e.target.value })} />
              </div>
            )}
          />
        </SectionCard>

        {/* ---------------- Team ---------------- */}
        <SectionCard
          title="Team"
          subtitle="Swipeable round team photos"
          enabled={config.team.enabled}
          onToggle={(v) => patch("team", { enabled: v })}
        >
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Heading" value={config.team.heading} onChange={(v) => patch("team", { heading: v })} />
            <TextField label="Highlight" value={config.team.headingHighlight} onChange={(v) => patch("team", { headingHighlight: v })} />
          </div>
          <TextArea label="Subheading" value={config.team.subheading} onChange={(v) => patch("team", { subheading: v })} />
          <label className="flex items-center gap-2 text-[0.85rem]">
            <input
              type="checkbox"
              checked={config.team.autoScroll !== false}
              onChange={(e) => patch("team", { autoScroll: e.target.checked })}
            />
            Auto-scroll the carousel (pauses on touch/hover)
          </label>
          <div>
            <span className="mb-1 block text-[0.82rem] font-medium">Members</span>
            <ListEditor
              items={config.team.members}
              onChange={(members) => patch("team", { members })}
              makeNew={() => ({ id: uid(), name: "New member", role: "", photoUrl: "" })}
              addLabel="Add member"
              renderItem={(m, update) => (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem] font-medium" value={m.name} placeholder="Name" onChange={(e) => update({ name: e.target.value })} />
                    <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={m.role} placeholder="Role" onChange={(e) => update({ role: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 rounded-full border border-border bg-muted bg-cover bg-center" style={m.photoUrl ? { backgroundImage: `url(${m.photoUrl})` } : undefined} />
                    <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={m.photoUrl} placeholder="Photo URL" onChange={(e) => update({ photoUrl: e.target.value })} />
                  </div>
                </div>
              )}
            />
          </div>
        </SectionCard>

        {/* ---------------- Location ---------------- */}
        <SectionCard
          title="Location"
          subtitle="Map + address"
          enabled={config.location.enabled}
          onToggle={(v) => patch("location", { enabled: v })}
        >
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Heading" value={config.location.heading} onChange={(v) => patch("location", { heading: v })} />
            <TextField label="Highlight" value={config.location.headingHighlight} onChange={(v) => patch("location", { headingHighlight: v })} />
          </div>
          <TextField
            label="Address"
            value={config.location.address}
            onChange={(v) => patch("location", { address: v })}
            placeholder="Studio address, Jaipur"
            hint="Shown beside the map. Used to build the map if no embed link is given."
          />
          <TextArea
            label="Google Maps embed (optional)"
            value={config.location.mapsEmbedUrl}
            onChange={(v) => patch("location", { mapsEmbedUrl: v })}
            rows={2}
            hint="Leave blank to use the address above. For an exact pin: Google Maps → Share → EMBED A MAP tab (not 'Send a link') → Copy HTML, and paste it here. Note: a plain 'Copy link' share link (goo.gl/…) will NOT work — use the address instead. You can also paste raw coordinates like 26.8613,75.7601."
          />
        </SectionCard>

        {/* ---------------- Order + visibility ---------------- */}
        <SectionCard title="Section order" subtitle="Drag sections up or down, or hide them">
          <div className="flex flex-col gap-1.5">
            {config.sectionOrder.map((key, i) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                <span className="text-[0.88rem]">{SECTION_TITLES[key]}</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0} aria-label="Move up" className="px-1 text-lg leading-none disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => moveSection(i, 1)} disabled={i === config.sectionOrder.length - 1} aria-label="Move down" className="px-1 text-lg leading-none disabled:opacity-30">↓</button>
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
      ) : null}
    </div>
  );
};

export default AdminContent;
