import { useRef, useState } from "react";
import { ChevronDown, GripVertical, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeImageUrl, uploadImage } from "@/lib/storage";

/**
 * A small, consistent kit of form controls for the admin content editors.
 * Everything is light-themed to match the public site, not the old dark tabs.
 */

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-[0.9rem] outline-none transition-colors focus:border-foreground";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.82rem] font-medium">{label}</span>
      <input
        className={inputCls}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <span className="mt-1 block text-[0.75rem] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.82rem] font-medium">{label}</span>
      <textarea
        className={inputCls}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/**
 * Image field with two ways in: upload a file (stored in Supabase, reliable),
 * or paste a link (Google Drive share links are auto-converted to a usable
 * form). Upload is the recommended path.
 */
export function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError("");
    const res = await uploadImage(file);
    setUploading(false);
    if (res.ok && res.url) onChange(res.url);
    else setError(res.message ?? "Upload failed.");
  };

  return (
    <div>
      <span className="mb-1 block text-[0.82rem] font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <div
          className="h-14 w-14 shrink-0 rounded-lg border border-border bg-muted bg-cover bg-center"
          style={value ? { backgroundImage: `url(${value})` } : undefined}
        />
        <div className="flex flex-1 flex-col gap-1.5">
          <input
            className={inputCls}
            value={value}
            placeholder="Paste a link, or upload →"
            onChange={(e) => onChange(e.target.value)}
            onBlur={(e) => onChange(normalizeImageUrl(e.target.value))}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[0.78rem] font-medium transition-colors hover:border-foreground disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {uploading ? "Uploading…" : "Upload"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-[0.78rem] text-muted-foreground hover:text-destructive"
              >
                Remove
              </button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {error ? <span className="text-[0.75rem] text-destructive">{error}</span> : null}
        </div>
      </div>
      {hint ? <span className="mt-1 block text-[0.75rem] text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5"
      aria-pressed={checked}
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "left-0.5 translate-x-4" : "left-0.5"
          )}
        />
      </span>
      <span className="text-[0.85rem] font-medium">{label}</span>
    </button>
  );
}

/**
 * A collapsible section card. Header shows the title, an optional show/hide
 * toggle, and reorder arrows; the body holds the fields.
 */
export function SectionCard({
  title,
  subtitle,
  enabled,
  onToggle,
  onMoveUp,
  onMoveDown,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  enabled?: boolean;
  onToggle?: (v: boolean) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 p-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
          <span>
            <span className="block font-medium">{title}</span>
            {subtitle ? (
              <span className="block text-[0.78rem] text-muted-foreground">{subtitle}</span>
            ) : null}
          </span>
        </button>

        {onMoveUp || onMoveDown ? (
          <span className="flex items-center text-muted-foreground">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!onMoveUp}
              aria-label="Move up"
              className="px-1 text-lg leading-none disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!onMoveDown}
              aria-label="Move down"
              className="px-1 text-lg leading-none disabled:opacity-30"
            >
              ↓
            </button>
          </span>
        ) : null}

        {onToggle ? (
          <Toggle label={enabled ? "On" : "Off"} checked={!!enabled} onChange={onToggle} />
        ) : null}
      </div>

      {open ? <div className="flex flex-col gap-3 border-t border-border p-4">{children}</div> : null}
    </div>
  );
}

/**
 * Editor for a list of items (features, steps, FAQ, etc). Renders each item via
 * `renderItem`, with add/remove/reorder handled here.
 */
export function ListEditor<T>({
  items,
  onChange,
  renderItem,
  makeNew,
  addLabel = "Add",
}: {
  items: T[];
  onChange: (next: T[]) => void;
  renderItem: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode;
  makeNew: () => T;
  addLabel?: string;
}) {
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-border bg-background p-3">
          <div className="mb-2 flex items-center justify-between">
            <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div className="flex items-center gap-1 text-muted-foreground">
              <button type="button" onClick={() => move(i, -1)} aria-label="Move up" className="px-1 disabled:opacity-30" disabled={i === 0}>↑</button>
              <button type="button" onClick={() => move(i, 1)} aria-label="Move down" className="px-1 disabled:opacity-30" disabled={i === items.length - 1}>↓</button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, k) => k !== i))}
                aria-label="Remove"
                className="px-1 text-destructive"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          {renderItem(item, (patch) =>
            onChange(items.map((it, k) => (k === i ? { ...it, ...patch } : it)))
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, makeNew()])}
        className="inline-flex items-center gap-1.5 self-start rounded-full border border-border px-3.5 py-1.5 text-[0.82rem] font-medium transition-colors hover:border-foreground"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {addLabel}
      </button>
    </div>
  );
}
