import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SiteConfig } from "@/types/site-config";
import { defaultSiteConfig, loadSiteConfig, saveSiteConfig } from "@/data/default-config";
import { fetchConfigFromCloud } from "@/lib/config-api";
import { applySiteBackground, applyCustomThemeColors } from "@/lib/theme-utils";

interface SiteConfigContextValue {
  config: SiteConfig;
  setConfig: (next: SiteConfig | ((prev: SiteConfig) => SiteConfig)) => void;
  updateConfig: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void;
  resetToDefaults: () => void;
}

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<SiteConfig>(loadSiteConfig);

  // On mount: if cloud is configured, fetch config so all users see the same content
  useEffect(() => {
    fetchConfigFromCloud().then((remote) => {
      if (remote) {
        setConfigState(remote);
        saveSiteConfig(remote);
      }
    });
  }, []);

  useEffect(() => {
    saveSiteConfig(config);
    const root = document.documentElement;

    // 1. Site-wide background (body)
    applySiteBackground(
      config.branding?.siteBackgroundColor,
      config.branding?.siteBackgroundImage
    );

    // 2. Preset theme (CSS vars on :root)
    const preset = config.themePresets.find((t) => t.id === config.activeThemeId);
    if (preset?.cssVars && Object.keys(preset.cssVars).length > 0) {
      Object.entries(preset.cssVars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    } else {
      config.themePresets.forEach((t) => {
        Object.keys(t.cssVars).forEach((key) => root.style.removeProperty(key));
      });
    }

    // 3. Custom theme colors (override preset when set)
    applyCustomThemeColors(config.customThemeColors);
  }, [config]);

  const setConfig = useCallback((next: SiteConfig | ((prev: SiteConfig) => SiteConfig)) => {
    setConfigState((prev) => (typeof next === "function" ? next(prev) : next));
  }, []);

  const updateConfig = useCallback(<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => {
    setConfigState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfigState(defaultSiteConfig);
  }, []);

  const value = useMemo(
    () => ({ config, setConfig, updateConfig, resetToDefaults }),
    [config, setConfig, updateConfig, resetToDefaults]
  );

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) throw new Error("useSiteConfig must be used within SiteConfigProvider");
  return ctx;
}
