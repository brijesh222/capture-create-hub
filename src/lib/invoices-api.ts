import { getSupabase } from "./supabase";

export interface ManualInvoice {
  id: string;
  seq: number;
  number: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientLocation: string;
  shootDate: string; // YYYY-MM-DD or ""
  bookingDate: string; // YYYY-MM-DD or ""
  serviceName: string;
  packageName: string;
  deliverables: string[];
  totalRupees: number;
  advanceRupees: number;
  notes: string;
  createdAt: string;
}

export interface ManualInvoiceInput {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientLocation: string;
  shootDate: string;
  bookingDate: string;
  serviceName: string;
  packageName: string;
  deliverables: string[];
  totalRupees: number;
  advanceRupees: number;
  notes: string;
}

/** Human invoice number from the row's sequence + issue year, e.g. DA-2026-0007. */
export function invoiceNumber(seq: number, createdAt: string): string {
  const year = new Date(createdAt).getFullYear() || new Date().getFullYear();
  return `DA-${year}-${String(seq).padStart(4, "0")}`;
}

function fromRow(r: Record<string, unknown>): ManualInvoice {
  const seq = Number(r.seq ?? 0);
  const createdAt = String(r.created_at ?? "");
  return {
    id: String(r.id),
    seq,
    number: (r.number as string) || invoiceNumber(seq, createdAt),
    clientName: (r.client_name as string) ?? "",
    clientPhone: (r.client_phone as string) ?? "",
    clientEmail: (r.client_email as string) ?? "",
    clientLocation: (r.client_location as string) ?? "",
    shootDate: (r.shoot_date as string) ?? "",
    bookingDate: (r.booking_date as string) ?? "",
    serviceName: (r.service_name as string) ?? "",
    packageName: (r.package_name as string) ?? "",
    deliverables: Array.isArray(r.deliverables) ? (r.deliverables as string[]) : [],
    totalRupees: Math.round(Number(r.total_paise ?? 0) / 100),
    advanceRupees: Math.round(Number(r.advance_paise ?? 0) / 100),
    notes: (r.notes as string) ?? "",
    createdAt,
  };
}

export async function listManualInvoices(): Promise<ManualInvoice[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("manual_invoices")
    .select("*")
    .order("seq", { ascending: false });
  if (error || !data) return [];
  return data.map(fromRow);
}

export async function createManualInvoice(
  input: ManualInvoiceInput
): Promise<{ ok: true; invoice: ManualInvoice } | { ok: false; message: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, message: "Database isn't connected." };
  const { data, error } = await supabase
    .from("manual_invoices")
    .insert({
      client_name: input.clientName,
      client_phone: input.clientPhone,
      client_email: input.clientEmail,
      client_location: input.clientLocation,
      shoot_date: input.shootDate || null,
      booking_date: input.bookingDate || null,
      service_name: input.serviceName,
      package_name: input.packageName,
      deliverables: input.deliverables,
      total_paise: Math.round(input.totalRupees * 100),
      advance_paise: Math.round(input.advanceRupees * 100),
      notes: input.notes,
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, message: error?.message || "Couldn't save the invoice." };
  }
  return { ok: true, invoice: fromRow(data) };
}

export async function deleteManualInvoice(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from("manual_invoices").delete().eq("id", id);
  return !error;
}
