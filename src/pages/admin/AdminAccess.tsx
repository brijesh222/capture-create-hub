import { useEffect, useState } from "react";
import { ArrowUpDown, KeyRound, Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/admin/fields";
import { useMyAccess } from "@/context/AdminAccessContext";
import { CAPS, ALL_CAPS, type Cap } from "@/lib/admin-perms";
import {
  addAdmin,
  changeMyPassword,
  listAdmins,
  removeAdmin,
  resetAdminPassword,
  setAdminPermissions,
  setAdminRole,
  type AdminUser,
} from "@/lib/admins-api";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const CapChecks = ({
  value,
  onToggle,
  disabled,
}: {
  value: Cap[];
  onToggle: (cap: Cap, on: boolean) => void;
  disabled?: boolean;
}) => (
  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
    {CAPS.map((c) => (
      <label key={c.key} className="flex items-center gap-1.5 text-[0.82rem]">
        <input
          type="checkbox"
          disabled={disabled}
          checked={value.includes(c.key)}
          onChange={(e) => onToggle(c.key, e.target.checked)}
        />
        {c.label}
      </label>
    ))}
  </div>
);

const AdminAccess = () => {
  const me = useMyAccess();

  // own password (everyone)
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  // super-only state
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [myId, setMyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "super">("admin");
  const [newPerms, setNewPerms] = useState<Cap[]>(ALL_CAPS);
  const [adding, setAdding] = useState(false);

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
          setMyId(res.me);
          setLoadError("");
        }
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    if (me.isSuper) load();
    else setLoading(false);
  }, [me.isSuper]);

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
    const res = await addAdmin(newEmail, newAdminPass, newRole, newRole === "super" ? [] : newPerms);
    setAdding(false);
    if ("ok" in res) {
      toast.success(`${newEmail} can now log in with that temp password.`);
      setNewEmail("");
      setNewAdminPass("");
      setNewRole("admin");
      setNewPerms(ALL_CAPS);
      load();
    } else toast.error(res.error);
  };

  const togglePerm = async (a: AdminUser, cap: Cap, on: boolean) => {
    const next = on ? [...a.permissions, cap] : a.permissions.filter((c) => c !== cap);
    setAdmins((list) => list.map((x) => (x.user_id === a.user_id ? { ...x, permissions: next } : x)));
    const res = await setAdminPermissions(a.user_id, next);
    if (!("ok" in res)) {
      toast.error(res.error);
      load();
    }
  };

  const toggleRole = async (a: AdminUser) => {
    const nextRole = a.role === "super" ? "admin" : "super";
    setBusyId(a.user_id);
    const res = await setAdminRole(a.user_id, nextRole);
    setBusyId(null);
    if ("ok" in res) {
      toast.success(nextRole === "super" ? "Promoted to super admin." : "Set to normal admin.");
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
          {me.isSuper
            ? "Change your password and manage who can log in and what they can do."
            : "Change your login password."}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* ---- Your password (everyone) ---- */}
        <SectionCard title="Your password" subtitle="Change your own login password" defaultOpen>
          <input type="password" autoComplete="new-password" className="rounded-lg border border-border bg-card px-3 py-2 text-[0.9rem]" placeholder="New password (8+ characters)" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          <input type="password" autoComplete="new-password" className="rounded-lg border border-border bg-card px-3 py-2 text-[0.9rem]" placeholder="Confirm new password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
          <button type="button" onClick={savePassword} disabled={savingPass} className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-[0.9rem] font-medium text-primary-foreground disabled:opacity-60">
            {savingPass ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Change password
          </button>
        </SectionCard>

        {!me.isSuper ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Only a super admin can add or manage other admins. Ask them to adjust your access.
          </p>
        ) : (
          <>
            {/* ---- Add admin ---- */}
            <SectionCard title="Add an admin" subtitle="They log in with the temp password you set" defaultOpen>
              <div className="grid gap-2 sm:grid-cols-2">
                <input type="email" className="rounded-lg border border-border bg-card px-3 py-2 text-[0.9rem]" placeholder="their@email.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                <input type="text" className="rounded-lg border border-border bg-card px-3 py-2 text-[0.9rem]" placeholder="Temp password (8+)" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 text-[0.85rem]">
                <span className="text-muted-foreground">Role</span>
                <select className="rounded-lg border border-border bg-card px-3 py-1.5 text-[0.85rem]" value={newRole} onChange={(e) => setNewRole(e.target.value as "admin" | "super")}>
                  <option value="admin">Admin (limited access)</option>
                  <option value="super">Super admin (full access)</option>
                </select>
              </div>
              {newRole === "admin" ? (
                <div>
                  <span className="mb-1 block text-[0.82rem] font-medium">What they can manage</span>
                  <CapChecks value={newPerms} onToggle={(cap, on) => setNewPerms((p) => (on ? [...p, cap] : p.filter((c) => c !== cap)))} />
                </div>
              ) : null}
              <button type="button" onClick={submitAddAdmin} disabled={adding} className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-[0.9rem] font-medium text-primary-foreground disabled:opacity-60">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Add admin
              </button>
              <p className="text-[0.75rem] text-muted-foreground">Share the email + temp password. They can change it under "Your password" after logging in.</p>
            </SectionCard>

            {/* ---- Current admins ---- */}
            <SectionCard title="Current admins" subtitle={`${admins.length} with access`} defaultOpen>
              {loading ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
              ) : loadError ? (
                <p className="text-sm text-destructive">{loadError}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {admins.map((a) => (
                    <div key={a.user_id} className="rounded-lg border border-border bg-background px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[0.9rem] font-medium">
                            <span className="truncate">{a.email}</span>
                            <span className={a.role === "super" ? "rounded-full bg-primary/10 px-2 py-0.5 text-[0.66rem] font-semibold text-primary" : "rounded-full bg-muted px-2 py-0.5 text-[0.66rem] text-muted-foreground"}>
                              {a.role === "super" ? "Super admin" : "Admin"}
                            </span>
                            {a.user_id === myId ? <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.66rem] text-secondary-foreground">You</span> : null}
                          </div>
                          <div className="text-[0.75rem] text-muted-foreground">Added {fmtDate(a.created_at)}</div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button type="button" disabled={busyId === a.user_id} onClick={() => toggleRole(a)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[0.78rem] font-medium hover:border-foreground disabled:opacity-40">
                            <ArrowUpDown className="h-3.5 w-3.5" />
                            {a.role === "super" ? "Make admin" : "Make super"}
                          </button>
                          <button type="button" onClick={() => { setResetFor(resetFor === a.user_id ? null : a.user_id); setResetPass(""); }} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[0.78rem] font-medium hover:border-foreground">
                            <KeyRound className="h-3.5 w-3.5" /> Password
                          </button>
                          {a.user_id !== myId ? (
                            <button type="button" disabled={busyId === a.user_id} onClick={() => doRemove(a)} aria-label="Remove admin" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-destructive hover:bg-destructive/10 disabled:opacity-40">
                              {busyId === a.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {a.role === "admin" ? (
                        <div className="mt-2.5 border-t border-border pt-2.5">
                          <span className="mb-1 block text-[0.76rem] font-medium text-muted-foreground">Can manage</span>
                          <CapChecks value={a.permissions} onToggle={(cap, on) => togglePerm(a, cap, on)} />
                        </div>
                      ) : (
                        <div className="mt-2 text-[0.76rem] text-muted-foreground">Full access to everything.</div>
                      )}

                      {resetFor === a.user_id ? (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border pt-2.5">
                          <input type="text" className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-[0.85rem]" placeholder="New password (8+)" value={resetPass} onChange={(e) => setResetPass(e.target.value)} />
                          <button type="button" disabled={busyId === a.user_id} onClick={() => doReset(a)} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[0.82rem] font-medium text-primary-foreground disabled:opacity-60">
                            {busyId === a.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            Set password
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAccess;
