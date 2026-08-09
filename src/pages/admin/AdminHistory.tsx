import { useEffect, useMemo, useState } from "react";
import { ChevronDown, History as HistoryIcon, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { mergeWithDefaults } from "@/data/default-config";
import { saveConfigToCloud } from "@/lib/config-api";
import { fetchConfigHistory, type ConfigVersion } from "@/lib/history-api";
import { diffConfigs } from "@/lib/config-diff";

function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Version history of the site content. Each row is what the site looked like
 * before someone's change; the super admin can see exactly what changed and
 * restore (undo) any version. Restoring is itself saved, so it's undoable too.
 */
const AdminHistory = () => {
  const { config, setConfig } = useSiteConfig();
  const [versions, setVersions] = useState<ConfigVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchConfigHistory()
      .then(setVersions)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // What changed between each stored version and the current live content.
  const diffs = useMemo(
    () => Object.fromEntries(versions.map((v) => [v.id, diffConfigs(v.config, config)])),
    [versions, config]
  );

  const restore = async (v: ConfigVersion) => {
    if (!window.confirm(`Restore the version from ${when(v.createdAt)}? Current content is replaced (and kept in history, so this is undoable).`)) return;
    setBusyId(v.id);
    const restored = mergeWithDefaults(v.config);
    setConfig(restored);
    const res = await saveConfigToCloud(restored);
    setBusyId(null);
    if (res.ok) {
      toast.success("Restored — the site now shows that version.");
      load();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-2xl font-light tracking-[-0.028em]">History</h1>
        <p className="text-sm text-muted-foreground">
          Each version is what the site looked like before a change. See what changed and restore to undo.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
        </div>
      ) : versions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No saved versions yet — they'll appear here from the next content save onward.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {versions.map((v) => {
            const changes = diffs[v.id] ?? [];
            const open = openId === v.id;
            return (
              <div key={v.id} className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <HistoryIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-[0.9rem] font-medium">{when(v.createdAt)}</div>
                      <div className="truncate text-[0.76rem] text-muted-foreground">
                        replaced by {v.savedByEmail || "unknown"} ·{" "}
                        {changes.length === 0 ? "same as now" : `${changes.length} difference${changes.length > 1 ? "s" : ""} vs now`}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {changes.length ? (
                      <button type="button" onClick={() => setOpenId(open ? null : v.id)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[0.8rem] font-medium hover:border-foreground">
                        What changed
                        <ChevronDown className={"h-3.5 w-3.5 transition-transform " + (open ? "rotate-180" : "")} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busyId === v.id || changes.length === 0}
                      onClick={() => restore(v)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[0.82rem] font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))] disabled:opacity-40"
                    >
                      {busyId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      Restore
                    </button>
                  </div>
                </div>

                {open && changes.length ? (
                  <div className="mt-2.5 flex flex-col gap-1.5 border-t border-border pt-2.5">
                    {changes.map((c, i) => (
                      <div key={i} className="text-[0.8rem]">
                        <span className="font-medium">{c.path}</span>
                        <div className="text-muted-foreground">
                          <span className="text-destructive line-through">{c.to}</span>
                          {"  →  "}
                          <span className="text-primary">{c.from}</span>
                        </div>
                      </div>
                    ))}
                    <p className="mt-1 text-[0.72rem] text-muted-foreground">
                      Struck-through is what's live now; the other is what restoring would set it back to.
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminHistory;
