import { useEffect, useState } from "react";
import { History as HistoryIcon, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { mergeWithDefaults } from "@/data/default-config";
import { saveConfigToCloud } from "@/lib/config-api";
import { fetchConfigHistory, type ConfigVersion } from "@/lib/history-api";

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
 * Version history of the site content. Super admins can restore any earlier
 * version — the undo for changes a normal admin made. Restoring saves a new
 * version, so it's itself undoable.
 */
const AdminHistory = () => {
  const { setConfig } = useSiteConfig();
  const [versions, setVersions] = useState<ConfigVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchConfigHistory()
      .then(setVersions)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const restore = async (v: ConfigVersion, index: number) => {
    if (!window.confirm(`Restore the version from ${when(v.createdAt)}? Your current content is replaced (and kept in history, so this is undoable).`)) return;
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
          Every content save is kept here. Restore any version to undo changes.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
        </div>
      ) : versions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No saved versions yet. They appear here after the next content save.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {versions.map((v, i) => (
            <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <HistoryIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[0.9rem] font-medium">
                    {when(v.createdAt)}
                    {i === 0 ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.66rem] font-semibold text-primary">Current</span> : null}
                  </div>
                  <div className="truncate text-[0.76rem] text-muted-foreground">
                    by {v.savedByEmail || "unknown"}
                  </div>
                </div>
              </div>
              {i !== 0 ? (
                <button
                  type="button"
                  disabled={busyId === v.id}
                  onClick={() => restore(v, i)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[0.82rem] font-medium transition-colors hover:border-foreground disabled:opacity-40"
                >
                  {busyId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  Restore
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminHistory;
