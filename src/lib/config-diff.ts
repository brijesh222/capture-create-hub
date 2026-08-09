/** A single changed value between two configs. */
export interface ConfigChange {
  path: string;
  from: string;
  to: string;
}

function fmt(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "string") return v.length > 60 ? v.slice(0, 60) + "…" : v || "(empty)";
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  const s = JSON.stringify(v);
  return s.length > 60 ? s.slice(0, 60) + "…" : s;
}

/** Make a raw path like categories[0].name friendlier for the admin. */
function label(path: string): string {
  return path
    .replace(/\[(\d+)\]/g, " #$1")
    .replace(/\./g, " › ")
    .replace(/^\s+/, "");
}

/**
 * Shallow-ish recursive diff of two config objects → a flat list of changed
 * leaves, capped so a big change set stays readable. Compares scalars; dives
 * into objects/arrays.
 */
export function diffConfigs(a: unknown, b: unknown, max = 20): ConfigChange[] {
  const changes: ConfigChange[] = [];

  const walk = (x: unknown, y: unknown, path: string) => {
    if (changes.length >= max) return;
    if (x === y) return;
    const ox = x && typeof x === "object";
    const oy = y && typeof y === "object";
    if (ox && oy) {
      if (Array.isArray(x) || Array.isArray(y)) {
        const ax = Array.isArray(x) ? x : [];
        const ay = Array.isArray(y) ? y : [];
        const n = Math.max(ax.length, ay.length);
        for (let i = 0; i < n; i++) walk(ax[i], ay[i], `${path}[${i}]`);
      } else {
        const keys = new Set([
          ...Object.keys(x as object),
          ...Object.keys(y as object),
        ]);
        for (const k of keys) {
          walk(
            (x as Record<string, unknown>)[k],
            (y as Record<string, unknown>)[k],
            path ? `${path}.${k}` : k
          );
        }
      }
    } else if (JSON.stringify(x) !== JSON.stringify(y)) {
      changes.push({ path: label(path), from: fmt(x), to: fmt(y) });
    }
  };

  walk(a, b, "");
  return changes;
}
