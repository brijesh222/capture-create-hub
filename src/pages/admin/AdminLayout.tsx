import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Outlet, useNavigate } from "react-router-dom";
import { getSession, onAuthChange, signOut } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LayoutDashboard, LogOut, Save } from "lucide-react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { saveConfigToCloud, isCloudConfigEnabled } from "@/lib/config-api";
import { toast } from "sonner";

const AdminLayout = () => {
  const navigate = useNavigate();
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
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/admin" className="flex items-center gap-2 font-display font-semibold text-foreground">
            <LayoutDashboard className="h-5 w-5" />
            Admin
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs hidden sm:inline" title={isCloudConfigEnabled() ? "Supabase connected – saves go to cloud" : "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and restart dev server"}>
              {isCloudConfigEnabled() ? (
                <span className="text-green-600 dark:text-green-400">Cloud: connected</span>
              ) : (
                <span className="text-muted-foreground">Cloud: not connected</span>
              )}
            </span>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-primary-foreground"
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
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
