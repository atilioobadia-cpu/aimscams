"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
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

export function UserForm({ id }: { id?: string }) {
  const router = useRouter();
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
      } else {
        if (password.trim()) body.password = password;
        await updateUser(id!, body);
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
    return <p className="text-[var(--font-size-secondary)] text-muted-foreground">Loading user...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-[var(--fs)] font-bold leading-tight text-strong">
          {editing ? "Edit user" : "Add user"}
        </h1>
        <p className="mt-1 text-[var(--fs)] text-muted-foreground">
          {editing ? "Update account details, roles and access." : "Create an institution account."}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-accent-red-bg bg-accent-red-bg px-4 py-3 text-[var(--font-size-secondary)] text-accent-red">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-card-border bg-surface p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[var(--font-size-secondary)] font-medium text-body">Email</label>
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
            <label className="mb-1.5 block text-[var(--font-size-secondary)] font-medium text-body">Full name</label>
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className="h-[var(--control-height)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[var(--font-size-secondary)] font-medium text-body">Phone</label>
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-[var(--control-height)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[var(--font-size-secondary)] font-medium text-body">Branch</label>
            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] text-[var(--font-size-secondary)]"
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
            <label className="mb-1.5 block text-[var(--font-size-secondary)] font-medium text-body">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] text-[var(--font-size-secondary)]"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[var(--font-size-secondary)] font-medium text-body">
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
          <p className="mb-2 text-[var(--font-size-secondary)] font-medium text-body">Roles</p>
          <div className="grid gap-2 md:grid-cols-2">
            {roles.map((role) => (
              <label key={role.code} className="flex items-start gap-2 rounded-lg border border-card-border px-3 py-2 text-[var(--font-size-secondary)]">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.code)}
                  onChange={() => toggleRole(role.code)}
                  className="mt-0.5 size-4"
                />
                <span>
                  <span className="font-medium text-strong">{role.name}</span>
                  <span className="block text-[var(--font-size-micro)] text-muted-foreground">{role.code}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/settings-administrator")}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-[var(--space-16)] text-[var(--font-size-secondary)] font-semibold">
            {saving ? "Saving..." : editing ? "Save changes" : "Create user"}
          </Button>
        </div>
      </form>
    </div>
  );
}

