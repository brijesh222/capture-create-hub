import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSiteConfig } from "@/context/SiteConfigContext";

export default function AdminBrandingEditor() {
  const { config, updateConfig } = useSiteConfig();
  const branding = config.branding;

  const set = (updates: Partial<typeof branding>) => {
    updateConfig("branding", { ...branding, ...updates });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>Site name, logo, and document meta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Site / product name</Label>
          <Input
            value={branding.siteName}
            onChange={(e) => set({ siteName: e.target.value })}
            placeholder="BP Productions"
          />
        </div>
        <div>
          <Label>Logo image URL</Label>
          <Input
            value={branding.logoUrl}
            onChange={(e) => set({ logoUrl: e.target.value })}
            placeholder="https://... or leave empty"
          />
        </div>
        <div>
          <Label>Document title (browser tab)</Label>
          <Input
            value={branding.documentTitle}
            onChange={(e) => set({ documentTitle: e.target.value })}
            placeholder="BP Productions | Photography"
          />
        </div>
        <div>
          <Label>Meta description</Label>
          <Textarea
            value={branding.metaDescription}
            onChange={(e) => set({ metaDescription: e.target.value })}
            rows={2}
          />
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <h4 className="font-medium text-foreground mb-2">Whole site background</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Change the background of the entire site. Color fills the page; image (optional) can sit on top.
          </p>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <Label className="text-xs">Background color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={branding.siteBackgroundColor || "#0f0f0f"}
                    onChange={(e) => set({ siteBackgroundColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
                  />
                  <Input
                    value={branding.siteBackgroundColor || ""}
                    onChange={(e) => set({ siteBackgroundColor: e.target.value })}
                    placeholder="#0f0f0f or leave default"
                    className="w-32 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Background image URL (optional)</Label>
              <Input
                value={branding.siteBackgroundImage || ""}
                onChange={(e) => set({ siteBackgroundImage: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
