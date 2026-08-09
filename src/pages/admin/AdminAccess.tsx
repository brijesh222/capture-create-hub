import { useEffect, useState } from "react";
import { KeyRound, Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/admin/fields";
import {
  addAdmin,
  changeMyPassword,
  listAdmins,
  removeAdmin,
  resetAdminPassword,
  type AdminUser,
} from "@/lib/admins-api";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const AdminAccess = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [me, setMe] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // my password
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  // add admin
  const [newEmail, setNewEmail] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [adding, setAdding] = useState(false);

  // per-row reset
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPass, setResetPass] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listAdmins()
      .then((res) => {
        if ("error" in res) setLoadError(res.error);
        else {
          setAdmins(res.admins);
          setMe(res.me);
          setLoadError("");
        }
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const savePassword = async () => {
    if (newPass.length < 8) return toast.error("Use at least 8 characters.");
    if (newPass !== confirmPass) return toast.error("Passwords don't match.");
    setSavingPass(true);
    const res = await changeMyPassword(newPass);
    setSavingPass(false);
    if ("ok" in res) {
      toast.success("Password changed.");
      setNewPass("");
      setConfirmPass("");
    } else toast.error(res.error);
  };

  const submitAddAdmin = async () => {
    if (!newEmail.includes("@")) return toast.error("Enter a valid email.");
    if (newAdminPass.length < 8) return toast.error("Temp password needs 8+ characters.");
    setAdding(true);
    const res = await addAdmin(newEmail, newAdminPass);
    setAdding(false);
    if ("ok" in res) {
      toast.success(`${newEmail} can now log in with that temp password.`);
      setNewEmail("");
      setNewAdminPass("");
      load();
    } else toast.error(res.error);
  };

  const doRemove = async (a: AdminUser) => {
    if (!window.confirm(`Remove admin access for ${a.email}? Their login is deleted.`)) return;
    setBusyId(a.user_id);
    const res = await removeAdmin(a.user_id);
    setBusyId(null);
    if ("ok" in res) {
      toast.success("Admin removed.");
      setAdmins((list) => list.filter((x) => x.user_id !== a.user_id));
    } else toast.error(res.error);
  };

  const doReset = async (a: AdminUser) => {
    if (resetPass.length < 8) return toast.error("New password needs 8+ characters.");
    setBusyId(a.user_id);
    const res = await resetAdminPassword(a.user_id, resetPass);
    setBusyId(null);
    if ("ok" in res) {
      toast.success(`Password reset for ${a.email}.`);
      setResetFor(null);
      setResetPass("");
    } else toast.error(res.error);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-2xl font-light tracking-[-0.028em]">Admins</h1>
        <p className="text-sm text-muted-foreground">
          Change your password, and manage who can log in to this panel.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* ---------------- Your password ---------------- */}
        <SectionCard title="Your password" subtitle="Change your own login password" defaultOpen>
          <input type="password" autoComplete="new-password" className="rounded-lg border border-border bg-card px-3 py-2 text-[0.9rem]" placeholder="New password (8+ characters)" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          <input type="password" autoComplete="new-password" className="rounded-lg border border-border bg-card px-3 py-2 text-[0.9rem]" placeholder="Confirm new password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
          <button type="button" onClick={savePassword} disabled={savingPass} className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-[0.9rem] font-medium text-primary-foreground disabled:opacity-60">
            {savingPass ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Change password
          </button>
        </SectionCard>

        {/* ---------------- Add admin ---------------- */}
        <SectionCard title="Add an admin" subtitle="They log in with the temp password you set" defaultOpen>
          <div className="grid gap-2 sm:grid-cols-2">
            <input type="email" className="rounded-lg border border-border bg-card px-3 py-2 text-[0.9rem]" placeholder="their@email.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <input type="text" className="rounded-lg border border-border bg-card px-3 py-2 text-[0.9rem]" placeholder="Temp password (8+)" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} />
          </div>
          <button type="button" onClick={submitAddAdmin} disabled={adding} className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-[0.9rem] font-medium text-primary-foreground disabled:opacity-60">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Add admin
          </button>
          <p className="text-[0.75rem] text-muted-foreground">Share the email + temp password with them. They can change it here after logging in.</p>
        </SectionCard>

        {/* ---------------- Current admins ---------------- */}
        <SectionCard title="Current admins" subtitle={`${admins.length} with access`} defaultOpen>
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
          ) : loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {admins.map((a) => (
                <div key={a.user_id} className="rounded-lg border border-border bg-background px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[0.9rem] font-medium">
                        <span className="truncate">{a.email}</span>
                        {a.user_id === me ? <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.68rem] text-secondary-foreground">You</span> : null}
                      </div>
                      <div className="text-[0.76rem] text-muted-foreground">Added {fmtDate(a.created_at)}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button type="button" onClick={() => { setResetFor(resetFor === a.user_id ? null : a.user_id); setResetPass(""); }} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[0.8rem] font-medium hover:border-foreground">
                        <KeyRound className="h-3.5 w-3.5" /> Reset password
                      </button>
                      {a.user_id !== me ? (
                        <button type="button" disabled={busyId === a.user_id} onClick={() => doRemove(a)} aria-label="Remove admin" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-destructive hover:bg-destructive/10 disabled:opacity-40">
                          {busyId === a.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {resetFor === a.user_id ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input type="text" className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-[0.85rem]" placeholder="New password (8+)" value={resetPass} onChange={(e) => setResetPass(e.target.value)} />
                      <button type="button" disabled={busyId === a.user_id} onClick={() => doReset(a)} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[0.82rem] font-medium text-primary-foreground disabled:opacity-60">
                        {busyId === a.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Set
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default AdminAccess;
