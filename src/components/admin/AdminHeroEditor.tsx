import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSiteConfig } from "@/context/SiteConfigContext";

export default function AdminHeroEditor() {
  const { config, updateConfig } = useSiteConfig();
  const hero = config.hero;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Section</CardTitle>
        <CardDescription>Home page hero background and text.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Background image URL</Label>
          <Input
            value={hero.backgroundImageUrl}
            onChange={(e) =>
              updateConfig("hero", { ...hero, backgroundImageUrl: e.target.value })
            }
            placeholder="https://... or leave empty for default"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Tagline</Label>
          <Input
            value={hero.tagline}
            onChange={(e) => updateConfig("hero", { ...hero, tagline: e.target.value })}
            placeholder="Premium Photography & Videography"
          />
        </div>
        <div>
          <Label>Title (before highlight)</Label>
          <Input
            value={hero.title}
            onChange={(e) => updateConfig("hero", { ...hero, title: e.target.value })}
            placeholder="We Capture Moments "
          />
        </div>
        <div>
          <Label>Title highlight</Label>
          <Input
            value={hero.titleHighlight}
            onChange={(e) =>
              updateConfig("hero", { ...hero, titleHighlight: e.target.value })
            }
            placeholder="That Last Forever"
          />
        </div>
        <div>
          <Label>Subtitle</Label>
          <Input
            value={hero.subtitle}
            onChange={(e) => updateConfig("hero", { ...hero, subtitle: e.target.value })}
            placeholder="From grand weddings to..."
          />
        </div>
        <div>
          <Label>Book Now button text</Label>
          <Input
            value={hero.ctaBookText}
            onChange={(e) =>
              updateConfig("hero", { ...hero, ctaBookText: e.target.value })
            }
          />
        </div>
        <div>
          <Label>WhatsApp button text</Label>
          <Input
            value={hero.ctaWhatsAppText}
            onChange={(e) =>
              updateConfig("hero", { ...hero, ctaWhatsAppText: e.target.value })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
