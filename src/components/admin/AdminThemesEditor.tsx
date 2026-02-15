import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { Button } from "@/components/ui/button";
import { Check, Palette } from "lucide-react";
import type { CustomThemeColors } from "@/types/site-config";
import { THEME_COLOR_KEYS } from "@/types/site-config";

const THEME_LABELS: Record<string, string> = {
  background: "Site background",
  foreground: "Text color",
  primary: "Primary (buttons, links)",
  "primary-foreground": "Text on primary",
  card: "Card background",
  "card-foreground": "Card text",
  border: "Borders",
  muted: "Muted background",
  "muted-foreground": "Muted text",
  accent: "Accent",
  gold: "Gold (highlights)",
};

const DEFAULT_HEX: Record<string, string> = {
  background: "#0f0f0f",
  foreground: "#e8e4df",
  primary: "#d4a017",
  "primary-foreground": "#0f0e0c",
  card: "#1a1816",
  "card-foreground": "#e8e4df",
  border: "#2d2822",
  muted: "#2a2620",
  "muted-foreground": "#7a7268",
  accent: "#b8860b",
  gold: "#d4a017",
};

export default function AdminThemesEditor() {
  const { config, updateConfig } = useSiteConfig();

  const setActiveTheme = (themeId: string) => {
    updateConfig("activeThemeId", themeId);
  };

  const setCustomColor = (key: string, hex: string) => {
    const next: CustomThemeColors = { ...config.customThemeColors, [key]: hex };
    if (!hex.trim()) {
      const { [key]: _, ...rest } = next;
      updateConfig("customThemeColors", rest);
    } else {
      updateConfig("customThemeColors", next);
    }
  };

  const clearCustomColors = () => {
    updateConfig("customThemeColors", {});
  };

  const hasCustomColors = config.customThemeColors && Object.keys(config.customThemeColors).length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preset themes</CardTitle>
          <CardDescription>
            Switch the site color theme (e.g. Diwali, Valentine's Day). Changes apply immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>Active theme</Label>
          <div className="flex flex-wrap gap-2">
            {config.themePresets.map((theme) => (
              <Button
                key={theme.id}
                type="button"
                variant={config.activeThemeId === theme.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTheme(theme.id)}
              >
                {config.activeThemeId === theme.id && <Check className="h-4 w-4 mr-1" />}
                {theme.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Customize colors
          </CardTitle>
          <CardDescription>
            Pick colors to override the theme. Site background, text, buttons, cards, borders — all update live. Clear to use the preset theme again.
          </CardDescription>
          {hasCustomColors && (
            <Button type="button" variant="outline" size="sm" onClick={clearCustomColors}>
              Clear custom colors
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {THEME_COLOR_KEYS.map((key) => {
              const value = config.customThemeColors?.[key] ?? "";
              const displayHex = value || DEFAULT_HEX[key] || "#000000";
              return (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs">{THEME_LABELS[key] || key}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={displayHex}
                      onChange={(e) => setCustomColor(key, e.target.value)}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded border border-border bg-transparent"
                      title={key}
                    />
                    <Input
                      value={value}
                      onChange={(e) => setCustomColor(key, e.target.value)}
                      placeholder={DEFAULT_HEX[key]}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
