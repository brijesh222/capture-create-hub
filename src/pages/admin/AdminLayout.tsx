import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getSession, onAuthChange, signOut } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Save } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { cn } from "@/lib/utils";
import { saveConfigToCloud } from "@/lib/config-api";
import { fetchMyAccess } from "@/lib/admins-api";
import { makeAccess, canAccessPath, type MyAccess } from "@/lib/admin-perms";
import { AdminAccessProvider } from "@/context/AdminAccessContext";
import { toast } from "sonner";

/** Tabs and the capability each needs. Undefined = everyone; "super" = super only. */
const TABS: { to: string; label: string; need?: string }[] = [
  { to: "/admin", label: "Bookings", need: "bookings" },
  { to: "/admin/content", label: "Content", need: "content|services" },
  { to: "/admin/reviews", label: "Reviews", need: "reviews" },
  { to: "/admin/invoices", label: "Invoices", need: "invoices" },
  { to: "/admin/settings", label: "Settings", need: "settings" },
  { to: "/admin/history", label: "History", need: "super" },
  { to: "/admin/access", label: "Admins" },
];

function tabAllowed(need: string | undefined, a: MyAccess): boolean {
  if (!need) return true;
  if (need === "super") return a.isSuper;
  return a.isSuper || need.split("|").some((c) => a.can(c as never));
}

const AdminLayout = () => {
  const navigate = useNavigate();
  const path = useLocation().pathname;
  const { config } = useSiteConfig();
  const [saving, setSaving] = useState(false);

  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [access, setAccess] = useState<MyAccess>(makeAccess(null, []));
  const [accessReady, setAccessReady] = useState(false);

  const showSave =
    (path.startsWith("/admin/content") || path.startsWith("/admin/settings")) &&
    access.canEditConfig;

  useEffect(() => {
    let active = true;
    getSession().then(async (s) => {
      if (!active) return;
      setSession(s);
      setChecking(false);
      if (!s) {
        navigate("/admin/login", { replace: true });
        return;
      }
      const a = await fetchMyAccess();
      if (!active) return;
      setAccess(a);
      setAccessReady(true);
    });
    const unsubscribe = onAuthChange((s) => {
      setSession(s);
      if (!s) navigate("/admin/login", { replace: true });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [navigate]);

  // Send an admin away from a page they can't access.
  useEffect(() => {
    if (!accessReady) return;
    if (!canAccessPath(path, access)) {
      const firstTab = TABS.find((t) => tabAllowed(t.need, access));
      navigate(firstTab ? firstTab.to : "/admin/access", { replace: true });
    }
  }, [accessReady, path, access, navigate]);

  const visibleTabs = useMemo(() => TABS.filter((t) => tabAllowed(t.need, access)), [access]);

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  const handleSave = async () => {
    setSaving(true);
    const { ok, message } = await saveConfigToCloud(config);
    setSaving(false);
    if (ok) toast.success(message);
    else toast.error(message);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </div>
    );
  }
  if (!session) return null;

  return (
    <AdminAccessProvider value={access}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <nav className="flex items-center gap-1 overflow-x-auto">
              {visibleTabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.to === "/admin"}
                  className={({ isActive }) =>
                    cn(
                      "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  {t.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              {showSave ? (
                <Button size="sm" onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              ) : null}
              <a href="/" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">View site</Button>
              </a>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </AdminAccessProvider>
  );
};

export default AdminLayout;
