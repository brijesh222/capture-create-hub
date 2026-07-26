import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { SectionCard, TextField, TextArea, ImageField, ListEditor } from "@/components/admin/fields";
import type { CategoryConfig } from "@/types/site-config";

const uid = () => Math.random().toString(36).slice(2, 9);
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Edit each service and its dedicated page — cover, intro, what's included,
 * reassurance points, gallery, per-service FAQ, price and SEO. Add or remove
 * services here; each one gets its own /category/<slug> page automatically.
 */
const AdminServices = () => {
  const { config, updateConfig } = useSiteConfig();
  const services = config.categories;

  const update = (id: string, p: Partial<CategoryConfig>) =>
    updateConfig("categories", services.map((c) => (c.id === id ? { ...c, ...p } : c)));

  // Packages belong to a service. They live in config.packages.items tagged by
  // serviceSlug; here we edit just the ones for one service, leaving the rest.
  const svcPackages = (slug: string) =>
    config.packages.items.filter((p) => p.serviceSlug === slug);
  const setSvcPackages = (slug: string, next: typeof config.packages.items) =>
    updateConfig("packages", {
      ...config.packages,
      items: [...config.packages.items.filter((p) => p.serviceSlug !== slug), ...next],
    });

  const addService = () => {
    const name = "New service";
    updateConfig("categories", [
      ...services,
      {
        id: uid(),
        name,
        slug: `service-${uid()}`,
        description: "",
        icon: "📷",
        thumbnailUrl: "",
        media: [],
        startingPrice: "",
        visible: true,
        intro: "",
        included: [],
        reassurance: [],
        faqItems: [],
      } as CategoryConfig,
    ]);
  };

  const removeService = (id: string) => {
    if (!window.confirm("Remove this service and its page?")) return;
    updateConfig("categories", services.filter((c) => c.id !== id));
  };

  return (
    <div className="flex flex-col gap-3">
      {services.map((svc) => (
        <SectionCard
          key={svc.id}
          title={svc.name || "Untitled service"}
          subtitle={`/category/${svc.slug}`}
          enabled={svc.visible !== false}
          onToggle={(v) => update(svc.id, { visible: v })}
        >
          <div className="grid grid-cols-2 gap-2">
            <TextField
              label="Name"
              value={svc.name}
              onChange={(v) => update(svc.id, { name: v })}
            />
            <TextField
              label="URL slug"
              value={svc.slug}
              onChange={(v) => update(svc.id, { slug: slugify(v) })}
              hint="Used in the web address."
            />
          </div>
          <TextField
            label="Starting price"
            value={svc.startingPrice ?? ""}
            onChange={(v) => update(svc.id, { startingPrice: v })}
            placeholder="from ₹15,000"
          />
          <ImageField
            label="Cover photo"
            value={svc.coverImageUrl ?? svc.thumbnailUrl}
            onChange={(v) => update(svc.id, { coverImageUrl: v, thumbnailUrl: v })}
            hint="Shown on the service card and the top of its page."
          />
          <TextArea
            label="Intro"
            value={svc.intro ?? svc.description}
            onChange={(v) => update(svc.id, { intro: v })}
          />

          <div>
            <span className="mb-1 block text-[0.82rem] font-medium">What's included</span>
            <ListEditor
              items={(svc.included ?? []).map((t) => ({ text: t }))}
              onChange={(rows) => update(svc.id, { included: rows.map((r) => r.text) })}
              makeNew={() => ({ text: "" })}
              addLabel="Add line"
              renderItem={(row, u) => (
                <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={row.text} onChange={(e) => u({ text: e.target.value })} />
              )}
            />
          </div>

          <div>
            <span className="mb-1 block text-[0.82rem] font-medium">Reassurance points</span>
            <ListEditor
              items={(svc.reassurance ?? []).map((t) => ({ text: t }))}
              onChange={(rows) => update(svc.id, { reassurance: rows.map((r) => r.text) })}
              makeNew={() => ({ text: "" })}
              addLabel="Add point"
              renderItem={(row, u) => (
                <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={row.text} onChange={(e) => u({ text: e.target.value })} />
              )}
            />
          </div>

          <div>
            <span className="mb-1 block text-[0.82rem] font-medium">Packages</span>
            <ListEditor
              items={svcPackages(svc.slug)}
              onChange={(next) => setSvcPackages(svc.slug, next)}
              makeNew={() => ({
                id: uid(),
                name: "New package",
                price: "₹0",
                priceNote: "",
                features: [],
                featured: false,
                tag: "",
                ctaText: "Check dates",
                serviceSlug: svc.slug,
              })}
              addLabel="Add package"
              renderItem={(pk, u) => (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem] font-medium" value={pk.name} placeholder="Name" onChange={(e) => u({ name: e.target.value })} />
                    <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={pk.price} placeholder="₹15,000" onChange={(e) => u({ price: e.target.value })} />
                  </div>
                  <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={pk.priceNote} placeholder="2 hours · indoor" onChange={(e) => u({ priceNote: e.target.value })} />
                  <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={pk.features.join(", ")} placeholder="Features, comma separated" onChange={(e) => u({ features: e.target.value.split(",").map((f) => f.trim()).filter(Boolean) })} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={pk.tag} placeholder='Tag e.g. "Most booked"' onChange={(e) => u({ tag: e.target.value })} />
                    <label className="flex items-center gap-2 text-[0.82rem]">
                      <input type="checkbox" checked={pk.featured} onChange={(e) => u({ featured: e.target.checked })} />
                      Highlight
                    </label>
                  </div>
                </div>
              )}
            />
            <p className="mt-1 text-[0.75rem] text-muted-foreground">
              These are what customers pick when booking this service.
            </p>
          </div>

          <div>
            <span className="mb-1 block text-[0.82rem] font-medium">Gallery photos</span>
            <ListEditor
              items={svc.media ?? []}
              onChange={(media) => update(svc.id, { media })}
              makeNew={() => ({ id: uid(), type: "photo" as const, url: "", caption: "" })}
              addLabel="Add photo"
              renderItem={(m, u) => (
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-lg border border-border bg-muted bg-cover bg-center" style={m.url ? { backgroundImage: `url(${m.url})` } : undefined} />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={m.url} placeholder="Photo URL" onChange={(e) => u({ url: e.target.value })} />
                    <input className="rounded-lg border border-border bg-card px-3 py-1.5 text-[0.82rem]" value={m.caption ?? ""} placeholder="Caption (optional)" onChange={(e) => u({ caption: e.target.value })} />
                  </div>
                </div>
              )}
            />
          </div>

          <div>
            <span className="mb-1 block text-[0.82rem] font-medium">
              Page FAQ <span className="font-normal text-muted-foreground">(falls back to the site FAQ if empty)</span>
            </span>
            <ListEditor
              items={svc.faqItems ?? []}
              onChange={(faqItems) => update(svc.id, { faqItems })}
              makeNew={() => ({ id: uid(), question: "", answer: "" })}
              addLabel="Add question"
              renderItem={(q, u) => (
                <div className="flex flex-col gap-2">
                  <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem] font-medium" value={q.question} placeholder="Question" onChange={(e) => u({ question: e.target.value })} />
                  <textarea className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" rows={2} value={q.answer} placeholder="Answer" onChange={(e) => u({ answer: e.target.value })} />
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <TextField label="Search title (SEO)" value={svc.seoTitle ?? ""} onChange={(v) => update(svc.id, { seoTitle: v })} />
            <TextArea label="Search description (SEO)" value={svc.seoDescription ?? ""} onChange={(v) => update(svc.id, { seoDescription: v })} rows={2} />
          </div>

          <button
            type="button"
            onClick={() => removeService(svc.id)}
            className="inline-flex items-center gap-1.5 self-start text-[0.82rem] font-medium text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Remove service
          </button>
        </SectionCard>
      ))}

      <button
        type="button"
        onClick={addService}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-[0.88rem] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add a service
      </button>
    </div>
  );
};

export default AdminServices;
