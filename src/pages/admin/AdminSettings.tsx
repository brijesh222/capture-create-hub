import { useSiteConfig } from "@/context/SiteConfigContext";
import { SectionCard, TextField, TextArea, ListEditor } from "@/components/admin/fields";

const uid = () => Math.random().toString(36).slice(2, 9);
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * The "machinery" side of the admin: booking rules, contact details, SEO and
 * theme. Rarely changed, unlike Content. Saves via the header Save button.
 */
const AdminSettings = () => {
  const { config, updateConfig } = useSiteConfig();

  const patch = <K extends keyof typeof config>(key: K, value: Partial<(typeof config)[K]>) =>
    updateConfig(key, { ...(config[key] as object), ...value } as (typeof config)[K]);

  const toggleDay = (d: number) => {
    const days = config.booking.workingDays.includes(d)
      ? config.booking.workingDays.filter((x) => x !== d)
      : [...config.booking.workingDays, d].sort();
    patch("booking", { workingDays: days });
  };

  const activeTheme = config.activeThemeId;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-2xl font-light tracking-[-0.028em]">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Booking rules, contact details, search info and colours.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* ---------------- Booking rules ---------------- */}
        <SectionCard title="Booking rules" subtitle="Advance, slots, working days, days off" defaultOpen>
          <div className="grid grid-cols-2 gap-2">
            <TextField
              label="Advance %"
              value={String(config.booking.advancePercent)}
              onChange={(v) => patch("booking", { advancePercent: Math.max(0, Math.min(100, parseInt(v) || 0)) })}
              hint="Taken up front to lock a date."
            />
            <TextField
              label="Earliest booking (days ahead)"
              value={String(config.booking.leadTimeDays)}
              onChange={(v) => patch("booking", { leadTimeDays: Math.max(0, parseInt(v) || 0) })}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-[0.82rem] font-medium">Working days</span>
            <div className="flex flex-wrap gap-1.5">
              {DAY_NAMES.map((name, d) => {
                const on = config.booking.workingDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={
                      "rounded-full px-3 py-1.5 text-[0.8rem] font-medium transition-colors " +
                      (on ? "bg-primary text-primary-foreground" : "border border-border hover:border-foreground")
                    }
                  >
                    {name}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[0.75rem] text-muted-foreground">Days not selected are closed for bookings.</p>
          </div>

          <div>
            <span className="mb-1 block text-[0.82rem] font-medium">Time slots</span>
            <ListEditor
              items={config.booking.slots}
              onChange={(slots) => patch("booking", { slots })}
              makeNew={() => ({ id: uid(), label: "New slot", start: "09:00", end: "12:00" })}
              addLabel="Add slot"
              renderItem={(sl, u) => (
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                  <input className="rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={sl.label} placeholder="Morning · 8–11 am" onChange={(e) => u({ label: e.target.value })} />
                  <input type="time" className="rounded-lg border border-border bg-card px-2 py-2 text-[0.82rem]" value={sl.start} onChange={(e) => u({ start: e.target.value })} />
                  <input type="time" className="rounded-lg border border-border bg-card px-2 py-2 text-[0.82rem]" value={sl.end} onChange={(e) => u({ end: e.target.value })} />
                </div>
              )}
            />
          </div>

          <div>
            <span className="mb-1 block text-[0.82rem] font-medium">Blackout dates (days off)</span>
            <ListEditor
              items={config.booking.blackoutDates.map((d) => ({ date: d }))}
              onChange={(rows) => patch("booking", { blackoutDates: rows.map((r) => r.date).filter(Boolean) })}
              makeNew={() => ({ date: "" })}
              addLabel="Add day off"
              renderItem={(row, u) => (
                <input type="date" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={row.date} onChange={(e) => u({ date: e.target.value })} />
              )}
            />
            <p className="mt-1 text-[0.75rem] text-muted-foreground">These dates are blocked on the calendar.</p>
          </div>

          <TextArea label="Terms text" value={config.booking.termsText} onChange={(v) => patch("booking", { termsText: v })} />
          <TextArea label="Confirmation message" value={config.booking.confirmationText} onChange={(v) => patch("booking", { confirmationText: v })} />
        </SectionCard>

        {/* ---------------- Contact ---------------- */}
        <SectionCard title="Contact" subtitle="Phone, WhatsApp, email, location">
          <TextField label="WhatsApp / phone number" value={config.contact.whatsappNumber} onChange={(v) => patch("contact", { whatsappNumber: v })} hint="Digits with country code, e.g. 917023433374" />
          <TextField label="Email" value={config.contact.email} onChange={(v) => patch("contact", { email: v })} />
          <TextField label="Location" value={config.contact.location} onChange={(v) => patch("contact", { location: v })} />
          <TextField label="Footer brand name" value={config.contact.footerBrandName} onChange={(v) => patch("contact", { footerBrandName: v })} />
          <TextField label="Footer tagline" value={config.contact.footerTagline} onChange={(v) => patch("contact", { footerTagline: v })} />
        </SectionCard>

        {/* ---------------- Search / sharing ---------------- */}
        <SectionCard title="Search & sharing" subtitle="How the site looks on Google and WhatsApp">
          <TextField label="Browser tab title" value={config.branding.documentTitle} onChange={(v) => patch("branding", { documentTitle: v })} />
          <TextArea label="Search description" value={config.branding.metaDescription} onChange={(v) => patch("branding", { metaDescription: v })} hint="Shown under the title in Google results." />
        </SectionCard>

        {/* ---------------- Theme ---------------- */}
        <SectionCard title="Colours" subtitle="Pick a theme or set the main colour">
          <div>
            <span className="mb-1.5 block text-[0.82rem] font-medium">Theme</span>
            <div className="flex flex-wrap gap-1.5">
              {config.themePresets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateConfig("activeThemeId", t.id)}
                  className={
                    "rounded-full px-3.5 py-1.5 text-[0.8rem] font-medium transition-colors " +
                    (activeTheme === t.id ? "bg-primary text-primary-foreground" : "border border-border hover:border-foreground")
                  }
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between">
            <span className="text-[0.85rem] font-medium">Main colour override</span>
            <input
              type="color"
              className="h-9 w-16 rounded border border-border bg-card"
              value={hslVarToHex(config.customThemeColors?.primary)}
              onChange={(e) => updateConfig("customThemeColors", { ...config.customThemeColors, primary: hexToHslVar(e.target.value) })}
            />
          </label>
          <p className="text-[0.75rem] text-muted-foreground">
            Overrides the theme's main colour (buttons, links, highlights).
          </p>
        </SectionCard>
      </div>
    </div>
  );
};

/** The config stores colours as "H S% L%" strings; the picker needs hex. */
function hslVarToHex(hsl?: string): string {
  if (!hsl) return "#235143";
  const m = hsl.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!m) return "#235143";
  const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
  const k = (n: number) => (n + h * 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

function hexToHslVar(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default AdminSettings;
