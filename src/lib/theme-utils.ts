/**
 * Convert hex to HSL string for CSS variables: "H S% L%"
 */
export function hexToHSL(hex: string): string {
  const cleaned = hex.replace(/^#/, "");
  if (!/^[0-9A-Fa-f]{6}$/.test(cleaned)) return "";
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  const hRound = Math.round(h * 360);
  const sRound = Math.round(s * 100);
  const lRound = Math.round(l * 100);
  return `${hRound} ${sRound}% ${lRound}%`;
}

export function applySiteBackground(
  backgroundColor?: string,
  backgroundImage?: string
): void {
  const body = document.body;
  if (!body) return;
  const color = backgroundColor?.trim();
  const image = backgroundImage?.trim();
  if (image) {
    body.style.backgroundImage = `url(${image})`;
    body.style.backgroundSize = "cover";
    body.style.backgroundPosition = "center";
    body.style.backgroundAttachment = "fixed";
    body.style.backgroundColor = color || "transparent";
  } else if (color) {
    body.style.backgroundImage = "";
    body.style.backgroundSize = "";
    body.style.backgroundPosition = "";
    body.style.backgroundAttachment = "";
    body.style.backgroundColor = color;
  } else {
    body.style.backgroundImage = "";
    body.style.backgroundSize = "";
    body.style.backgroundPosition = "";
    body.style.backgroundAttachment = "";
    body.style.backgroundColor = "";
  }
}

/** Set a preset's CSS variables on :root. Used to auto-theme a service page. */
export function applyThemeVars(cssVars: Record<string, string> | undefined): void {
  if (!cssVars) return;
  const root = document.documentElement;
  Object.entries(cssVars).forEach(([key, value]) => root.style.setProperty(key, value));
}

export function applyCustomThemeColors(colors: Record<string, string> | undefined): void {
  const root = document.documentElement;
  if (!colors || Object.keys(colors).length === 0) return;
  Object.entries(colors).forEach(([key, hex]) => {
    const varName = key.startsWith("--") ? key : `--${key}`;
    const hsl = hexToHSL(hex);
    if (hsl) root.style.setProperty(varName, hsl);
  });
}
