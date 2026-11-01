"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import {
  createUser,
  getUser,
  listBranches,
  listRoles,
  updateUser,
  type BranchSummary,
  type RoleSummary,
} from "@/lib/users";

export function UserForm({ id, layout = "modal" }: { id?: string; layout?: "modal" | "page" }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const editing = Boolean(id);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<string[]>(["details"]);

  useEffect(() => {
    let active = true;
    Promise.all([listBranches(), listRoles()])
      .then(([branchList, roleList]) => {
        if (!active) return;
        setBranches(branchList);
        setRoles(roleList);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load form data.");
      });

    if (id) {
      getUser(id)
        .then((user) => {
          if (!active) return;
          setEmail(user.email);
          setFullName(user.fullName);
          setPhone(user.phone ?? "");
          setBranchId(user.branch?.id ?? "");
          setStatus(user.status);
          setSelectedRoles(user.roles.map((role) => role.code));
        })
        .catch((err) => {
          if (!active) return;
          setError(err instanceof Error ? err.message : "Could not load user.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [id]);

  function toggleRole(code: string) {
    setSelectedRoles((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        branchId: branchId || null,
        roleCodes: selectedRoles,
        status,
      };

      if (!editing) {
        body.email = email.trim();
        body.password = password;
        await createUser(body);
        pushToast("User created.");
      } else {
        if (password.trim()) body.password = password;
        await updateUser(id!, body);
        pushToast("User updated.");
      }

      router.push("/settings-administrator");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save user.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="fs-text text-muted-foreground">Loading user...</p>;
  }

  if (layout === "page") {
    function toggleSection(section: string) {
      setOpenSections((current) => current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section]);
    }

    return (
      <div className="flex flex-col gap-[18px]">
        <section className="flex min-h-[82px] shrink-0 items-center rounded-[var(--card-radius)] border border-card-border bg-card px-[var(--space-24)]">
          <UserRound className="mr-3 size-6 text-primary" strokeWidth={1.8} aria-hidden="true" />
          <h1 className="fs-title font-semibold text-heading">{editing ? "Edit User" : "New User"}</h1>
        </section>

        {error ? <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 fs-text text-destructive">{error}</div> : null}

        <form onSubmit={handleSubmit} className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--space-24)]">
          <div className="space-y-5">
            <AccordionSection id="details" title="User details" open={openSections.includes("details")} onToggle={toggleSection}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Email" required><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={editing} required={!editing} autoComplete="email" /></FormField>
                <FormField label="Full name" required><Input value={fullName} onChange={(event) => setFullName(event.target.value)} required autoComplete="name" /></FormField>
                <FormField label="Phone"><Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" /></FormField>
                <FormField label="Status">
                  <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text text-body">
                    <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="LOCKED">Locked</option>
                  </select>
                </FormField>
                <FormField label={editing ? "New password (optional)" : "Password"} required={!editing}>
                  <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required={!editing} autoComplete="new-password" />
                </FormField>
              </div>
            </AccordionSection>

            <AccordionSection id="roles" title="Roles" open={openSections.includes("roles")} onToggle={toggleSection}>
              {roles.length ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {roles.map((role) => (
                    <label key={role.code} className="flex items-start gap-2 rounded-lg border border-card-border px-3 py-2 fs-text">
                      <input type="checkbox" checked={selectedRoles.includes(role.code)} onChange={() => toggleRole(role.code)} className="mt-0.5 size-4 accent-[var(--primary)]" />
                      <span><span className="font-medium text-heading">{role.name}</span><span className="block fs-text text-muted-foreground">{role.code}</span></span>
                    </label>
                  ))}
                </div>
              ) : <p className="fs-text text-muted-foreground">No roles are available for this organization.</p>}
            </AccordionSection>

            <AccordionSection id="branch" title="Branch Access" open={openSections.includes("branch")} onToggle={toggleSection}>
              <FormField label="Branch">
                <select value={branchId} onChange={(event) => setBranchId(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text text-body">
                  <option value="">Institution (no branch)</option>
                  {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>)}
                </select>
              </FormField>
            </AccordionSection>

            <AccordionSection id="wba" title="WBA Access" open={openSections.includes("wba")} onToggle={toggleSection}>
              <p className="rounded-lg border border-chrome bg-subtle px-4 py-3 fs-text text-muted-foreground">Business account access is not available in the current user access model.</p>
            </AccordionSection>

            <AccordionSection id="teller" title="Teller" open={openSections.includes("teller")} onToggle={toggleSection}>
              <div className="space-y-2">
                <label className="flex items-center gap-2 fs-text font-medium text-muted-foreground"><input type="checkbox" disabled className="size-4" />Is Teller</label>
                <p className="fs-text text-muted-foreground">Teller access is not available in the current user access model.</p>
              </div>
            </AccordionSection>
          </div>

          <div className="sticky bottom-0 -mx-[var(--space-24)] mt-6 flex justify-end gap-2 border-t border-chrome bg-card px-[var(--space-24)] pt-4">
            <Button type="button" variant="outline" onClick={() => router.push("/settings-administrator")} className="border-primary text-primary">Cancel</Button>
            <Button type="submit" disabled={saving || !fullName.trim() || (!editing && (!email.trim() || !password.trim()))} aria-busy={saving} className="bg-primary text-primary-foreground">{saving ? "Saving..." : editing ? "Save changes" : "Save"}</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="fs-title font-bold leading-tight text-strong">
          {editing ? "Edit user" : "Add user"}
        </h1>
        <p className="mt-1 fs-text text-muted-foreground">
          {editing ? "Update account details, roles and access." : "Create an institution account."}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-accent-red-bg bg-accent-red-bg px-4 py-3 fs-text text-accent-red">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-card-border bg-surface p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block fs-text font-medium text-body">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={editing}
              required={!editing}
              className="h-[var(--control-height)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block fs-text font-medium text-body">Full name</label>
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className="h-[var(--control-height)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block fs-text font-medium text-body">Phone</label>
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-[var(--control-height)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block fs-text font-medium text-body">Branch</label>
            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
            >
              <option value="">Institution (no branch)</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block fs-text font-medium text-body">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block fs-text font-medium text-body">
              {editing ? "New password (optional)" : "Password"}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required={!editing}
              className="h-[var(--control-height)]"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 fs-text font-medium text-body">Roles</p>
          <div className="grid gap-2 md:grid-cols-2">
            {roles.map((role) => (
              <label key={role.code} className="flex items-start gap-2 rounded-lg border border-card-border px-3 py-2 fs-text">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.code)}
                  onChange={() => toggleRole(role.code)}
                  className="mt-0.5 size-4"
                />
                <span>
                  <span className="font-medium text-strong">{role.name}</span>
                  <span className="block fs-text text-muted-foreground">{role.code}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/settings-administrator")}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
            {saving ? "Saving..." : editing ? "Save changes" : "Create user"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function AccordionSection({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--card-radius)] border border-chrome">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-content`}
        onClick={() => onToggle(id)}
        className="flex min-h-[58px] w-full items-center justify-between bg-subtle px-5 text-left fs-text font-semibold text-heading transition-colors hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {title}
        {open ? <ChevronUp className="size-4 text-muted-foreground" aria-hidden="true" /> : <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />}
      </button>
      {open ? <div id={`${id}-content`} className="border-t border-chrome p-5">{children}</div> : null}
    </section>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 fs-text font-medium text-body">
      <span>{label}{required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}</span>
      {children}
    </label>
  );
}

