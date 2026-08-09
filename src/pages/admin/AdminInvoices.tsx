import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, Plus, Trash2 } from "lucide-react";
import { SectionCard, TextField, TextArea, ListEditor } from "@/components/admin/fields";
import Invoice, { type InvoiceData } from "@/components/booking/Invoice";
import {
  createManualInvoice,
  deleteManualInvoice,
  listManualInvoices,
  type ManualInvoice,
  type ManualInvoiceInput,
} from "@/lib/invoices-api";
import { toast } from "sonner";

const emptyForm: ManualInvoiceInput = {
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  clientLocation: "",
  shootDate: "",
  bookingDate: "",
  serviceName: "",
  packageName: "",
  deliverables: [],
  totalRupees: 0,
  advanceRupees: 0,
  notes: "",
};

function longDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Turn a saved invoice into the printable Invoice's data shape. */
function toInvoiceData(inv: ManualInvoice): InvoiceData {
  return {
    invoiceNo: inv.number,
    issuedOn: longDate(inv.createdAt),
    customerName: inv.clientName,
    customerPhone: inv.clientPhone,
    customerLocation: inv.clientLocation,
    serviceName: inv.serviceName || "Photography",
    packageName: inv.packageName,
    shootDate: longDate(inv.shootDate),
    slotLabel: inv.bookingDate ? `Booked ${longDate(inv.bookingDate)}` : "",
    deliverables: inv.deliverables,
    totalRupees: inv.totalRupees,
    paidRupees: inv.advanceRupees,
  };
}

/** Mounts an invoice into <body>, prints it, then cleans up. */
const PrintInvoice = ({ data, onDone }: { data: InvoiceData; onDone: () => void }) => {
  const [host] = useState(() => document.createElement("div"));
  useEffect(() => {
    host.setAttribute("data-invoice-host", "");
    document.body.appendChild(host);
    const done = () => onDone();
    window.addEventListener("afterprint", done);
    const t = window.setTimeout(() => window.print(), 150);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("afterprint", done);
      host.remove();
    };
  }, [host, onDone]);
  return createPortal(<Invoice data={data} />, host);
};

/**
 * Create standalone invoices by hand and keep a list of them. Saved to the
 * manual_invoices table (admin-only), numbered automatically, and downloadable
 * as a PDF via the browser's print dialog using the same invoice layout the
 * booking flow uses.
 */
const AdminInvoices = () => {
  const [form, setForm] = useState<ManualInvoiceInput>(emptyForm);
  const [invoices, setInvoices] = useState<ManualInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [printData, setPrintData] = useState<InvoiceData | null>(null);

  const load = () => {
    setLoading(true);
    listManualInvoices()
      .then(setInvoices)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = (patch: Partial<ManualInvoiceInput>) => setForm((f) => ({ ...f, ...patch }));
  const remaining = Math.max(0, form.totalRupees - form.advanceRupees);

  const save = async () => {
    if (!form.clientName.trim()) {
      toast.error("Add the client's name first.");
      return;
    }
    setSaving(true);
    const res = await createManualInvoice({
      ...form,
      deliverables: form.deliverables.map((d) => d.trim()).filter(Boolean),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success(`Invoice ${res.invoice.number} saved.`);
    setForm(emptyForm);
    load();
  };

  const remove = async (inv: ManualInvoice) => {
    if (!window.confirm(`Delete invoice ${inv.number}? This can't be undone.`)) return;
    const ok = await deleteManualInvoice(inv.id);
    if (ok) {
      toast.success("Invoice deleted.");
      setInvoices((list) => list.filter((i) => i.id !== inv.id));
    } else {
      toast.error("Couldn't delete the invoice.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-2xl font-light tracking-[-0.028em]">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Create and download invoices by hand, kept for your records.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* ---------------- New invoice ---------------- */}
        <SectionCard title="New invoice" subtitle="Fill in the details and save" defaultOpen>
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Client name" value={form.clientName} onChange={(v) => set({ clientName: v })} />
            <TextField label="Phone" value={form.clientPhone} onChange={(v) => set({ clientPhone: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Email" value={form.clientEmail} onChange={(v) => set({ clientEmail: v })} />
            <TextField label="Location" value={form.clientLocation} onChange={(v) => set({ clientLocation: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Service" value={form.serviceName} onChange={(v) => set({ serviceName: v })} placeholder="Wedding" />
            <TextField label="Package" value={form.packageName} onChange={(v) => set({ packageName: v })} placeholder="Complete" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="mb-1 block text-[0.82rem] font-medium">Shoot date</span>
              <input type="date" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={form.shootDate} onChange={(e) => set({ shootDate: e.target.value })} />
            </div>
            <div>
              <span className="mb-1 block text-[0.82rem] font-medium">Booking date</span>
              <input type="date" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={form.bookingDate} onChange={(e) => set({ bookingDate: e.target.value })} />
            </div>
          </div>

          <div>
            <span className="mb-1 block text-[0.82rem] font-medium">Deliverables / services</span>
            <ListEditor
              items={form.deliverables.map((text) => ({ text }))}
              onChange={(rows) => set({ deliverables: rows.map((r) => r.text) })}
              makeNew={() => ({ text: "" })}
              addLabel="Add line"
              renderItem={(row, u) => (
                <input className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={row.text} placeholder="e.g. 250 edited photos" onChange={(e) => u({ text: e.target.value })} />
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="mb-1 block text-[0.82rem] font-medium">Total (₹)</span>
              <input type="number" min={0} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={form.totalRupees || ""} onChange={(e) => set({ totalRupees: Math.max(0, parseInt(e.target.value) || 0) })} />
            </div>
            <div>
              <span className="mb-1 block text-[0.82rem] font-medium">Advance (₹)</span>
              <input type="number" min={0} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[0.88rem]" value={form.advanceRupees || ""} onChange={(e) => set({ advanceRupees: Math.max(0, parseInt(e.target.value) || 0) })} />
            </div>
            <div>
              <span className="mb-1 block text-[0.82rem] font-medium">Remaining</span>
              <div className="rounded-lg border border-border bg-muted px-3 py-2 text-[0.88rem] text-muted-foreground">
                ₹{remaining.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <TextArea label="Notes (optional)" value={form.notes} onChange={(v) => set({ notes: v })} rows={2} />

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-primary px-6 py-2.5 text-[0.9rem] font-medium text-primary-foreground transition-colors hover:bg-[hsl(var(--gold-dark))] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Saving…" : "Save invoice"}
          </button>
        </SectionCard>

        {/* ---------------- Saved invoices ---------------- */}
        <SectionCard title="Saved invoices" subtitle={`${invoices.length} total`} defaultOpen>
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet. Create one above.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[0.9rem] font-medium">
                      <span className="font-mono text-[0.8rem] text-primary">{inv.number}</span>
                      <span className="truncate">{inv.clientName || "—"}</span>
                    </div>
                    <div className="text-[0.78rem] text-muted-foreground">
                      {inv.serviceName || "—"} · Total ₹{inv.totalRupees.toLocaleString("en-IN")} · Advance ₹{inv.advanceRupees.toLocaleString("en-IN")} · {longDate(inv.shootDate)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPrintData(toInvoiceData(inv))}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[0.8rem] font-medium transition-colors hover:border-foreground"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(inv)}
                      aria-label="Delete invoice"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {printData ? <PrintInvoice data={printData} onDone={() => setPrintData(null)} /> : null}
    </div>
  );
};

export default AdminInvoices;
