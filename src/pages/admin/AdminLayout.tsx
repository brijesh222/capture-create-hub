import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getSession, onAuthChange, signOut } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Save } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { cn } from "@/lib/utils";
import { saveConfigToCloud, isCloudConfigEnabled } from "@/lib/config-api";
import { toast } from "sonner";

const AdminLayout = () => {
  const navigate = useNavigate();
  const path = useLocation().pathname;
  // Save publishes site config, which the Content and Site-content pages edit.
  const showSave = path.startsWith("/admin/content") || path.startsWith("/admin/settings");
  const { config } = useSiteConfig();
  const [saving, setSaving] = useState(false);

  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    getSession().then((s) => {
      if (!active) return;
      setSession(s);
      setChecking(false);
      if (!s) navigate("/admin/login", { replace: true });
    });
    // Signing out in another tab, or a refresh token expiring, must kick the
    // admin out here too rather than leaving a dead panel open.
    const unsubscribe = onAuthChange((s) => {
      setSession(s);
      if (!s) navigate("/admin/login", { replace: true });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [navigate]);

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <nav className="flex items-center gap-1">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              Bookings
            </NavLink>
            <NavLink
              to="/admin/content"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              Content
            </NavLink>
            <NavLink
              to="/admin/reviews"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              Reviews
            </NavLink>
            <NavLink
              to="/admin/invoices"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              Invoices
            </NavLink>
            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              Settings
            </NavLink>
            <NavLink
              to="/admin/access"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              Admins
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            {/* Save only publishes site content; it does nothing on the
                bookings list, so it appears only on the settings page. */}
            {showSave ? (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-primary-foreground"
              >
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
  );
};

export default AdminLayout;
