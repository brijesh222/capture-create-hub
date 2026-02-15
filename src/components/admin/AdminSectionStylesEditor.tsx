import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSiteConfig } from "@/context/SiteConfigContext";
import type { SectionId, SectionStyleConfig } from "@/types/site-config";

const SECTION_LABELS: Record<SectionId, string> = {
  hero: "Hero",
  categories: "Categories",
  about: "About",
  "whatsapp-cta": "WhatsApp CTA",
  footer: "Footer",
  "floating-cta": "Floating CTA (mobile)",
  "category-header": "Category page header",
  gallery: "Gallery grid",
};

export default function AdminSectionStylesEditor() {
  const { config, updateConfig } = useSiteConfig();
  const sectionStyles = config.sectionStyles;

  const updateSection = (id: SectionId, updates: SectionStyleConfig) => {
    updateConfig("sectionStyles", {
      ...sectionStyles,
      [id]: { ...sectionStyles[id], ...updates },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section colors & styles</CardTitle>
        <CardDescription>Override background, border, or shadow for specific sections. Use CSS values (e.g. hsl(38 90% 50%), #fff, 0 4px 20px rgba(0,0,0,0.2)).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(Object.keys(SECTION_LABELS) as SectionId[]).map((id) => (
          <div key={id} className="rounded-lg border border-border p-4 space-y-3">
            <h4 className="font-medium text-foreground">{SECTION_LABELS[id]}</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <Label className="text-xs">Background</Label>
                <Input
                  value={sectionStyles[id]?.backgroundColor ?? ""}
                  onChange={(e) =>
                    updateSection(id, { ...sectionStyles[id], backgroundColor: e.target.value })
                  }
                  placeholder="transparent"
                />
              </div>
              <div>
                <Label className="text-xs">Border color</Label>
                <Input
                  value={sectionStyles[id]?.borderColor ?? ""}
                  onChange={(e) =>
                    updateSection(id, { ...sectionStyles[id], borderColor: e.target.value })
                  }
                  placeholder="default"
                />
              </div>
              <div>
                <Label className="text-xs">Shadow</Label>
                <Input
                  value={sectionStyles[id]?.shadow ?? ""}
                  onChange={(e) =>
                    updateSection(id, { ...sectionStyles[id], shadow: e.target.value })
                  }
                  placeholder="none"
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
