/** The capabilities a super admin can grant to a normal admin. */
export const CAPS = [
  { key: "content", label: "Home content" },
  { key: "services", label: "Service pages" },
  { key: "settings", label: "Settings" },
  { key: "bookings", label: "Bookings" },
  { key: "invoices", label: "Invoices" },
  { key: "reviews", label: "Reviews" },
] as const;

export type Cap = (typeof CAPS)[number]["key"];
export const ALL_CAPS: Cap[] = CAPS.map((c) => c.key);

/** Editing the shared site config needs any one of these. */
export const CONFIG_CAPS: Cap[] = ["content", "services", "settings"];

export interface MyAccess {
  role: "super" | "admin" | null;
  permissions: Cap[];
  isSuper: boolean;
  can: (cap: Cap) => boolean;
  canEditConfig: boolean;
}

export function makeAccess(role: MyAccess["role"], permissions: Cap[]): MyAccess {
  const isSuper = role === "super";
  const can = (cap: Cap) => isSuper || permissions.includes(cap);
  return {
    role,
    permissions,
    isSuper,
    can,
    canEditConfig: isSuper || CONFIG_CAPS.some((c) => permissions.includes(c)),
  };
}

/** Can this access reach an admin route? (access + history handled separately.) */
export function canAccessPath(path: string, a: MyAccess): boolean {
  if (a.isSuper) return true;
  if (path.startsWith("/admin/content")) return a.can("content") || a.can("services");
  if (path.startsWith("/admin/settings")) return a.can("settings");
  if (path.startsWith("/admin/invoices")) return a.can("invoices");
  if (path.startsWith("/admin/reviews")) return a.can("reviews");
  if (path.startsWith("/admin/history")) return false; // super only
  if (path.startsWith("/admin/access")) return true; // everyone can change own password
  return a.can("bookings"); // /admin (bookings inbox)
}
