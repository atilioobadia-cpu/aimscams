"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listBranches,
  listRoles,
  listUsers,
  unlockUser,
  updateUser,
  type BranchSummary,
  type RoleSummary,
  type UserSummary,
} from "@/lib/users";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [branchId, setBranchId] = useState("");

  const filters = useMemo(
    () => ({ q, status: status || undefined, role: role || undefined, branchId: branchId || undefined }),
    [q, status, role, branchId],
  );

  async function load() {
    setError(null);
    try {
      const [userList, branchList, roleList] = await Promise.all([
        listUsers(filters),
        branches.length ? Promise.resolve(branches) : listBranches(),
        roles.length ? Promise.resolve(roles) : listRoles(),
      ]);
      setUsers(userList);
      setBranches(branchList);
      setRoles(roleList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      listUsers(filters),
      branches.length ? Promise.resolve(branches) : listBranches(),
      roles.length ? Promise.resolve(roles) : listRoles(),
    ])
      .then(([userList, branchList, roleList]) => {
        if (!active) return;
        setUsers(userList);
        setBranches(branchList);
        setRoles(roleList);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load users.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, role, branchId]);

  async function toggleStatus(user: UserSummary) {
    const next = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateUser(user.id, { status: next });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update user.");
    }
  }

  async function unlock(id: string) {
    try {
      await unlockUser(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unlock user.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-bold leading-tight text-strong">Users</h1>
          <p className="mt-1 max-w-3xl text-[var(--font-size-secondary)] text-muted-foreground">
            Institution accounts, roles and branch access.
          </p>
        </div>
        <Button asChild className="h-[var(--control-height)] px-[var(--space-16)] text-[var(--font-size-secondary)] font-semibold">
          <Link href="/settings-administrator-add">Add user</Link>
        </Button>
      </div>

      <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <div className="grid gap-[var(--space-8)] md:grid-cols-4">
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search name or email"
            className="h-[var(--control-height)]"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-[var(--control-height)] rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] text-[var(--font-size-secondary)]"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LOCKED">Locked</option>
          </select>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="h-[var(--control-height)] rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] text-[var(--font-size-secondary)]"
          >
            <option value="">All roles</option>
            {roles.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
            className="h-[var(--control-height)] rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] text-[var(--font-size-secondary)]"
          >
            <option value="">All branches</option>
            {branches.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-accent-red-bg bg-accent-red-bg px-4 py-3 text-[13px] text-accent-red">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-[var(--font-size-secondary)]">
            <thead className="border-b border-card-border bg-subtle text-[var(--font-size-micro)] font-semibold uppercase tracking-wide text-label">
              <tr>
                <th className="px-4 py-3">Full name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No users match these filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-card-border last:border-0">
                    <td className="px-4 py-3 font-medium text-strong">{user.fullName}</td>
                    <td className="px-4 py-3 text-body">{user.email}</td>
                    <td className="px-4 py-3 text-body">{user.branch?.name ?? "Institution"}</td>
                    <td className="px-4 py-3 text-body">
                      {user.roles.map((role) => role.name).join(", ") || "No role"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[var(--font-size-micro)] font-semibold ${
                          user.status === "ACTIVE"
                            ? "bg-accent-teal-bg text-brand"
                            : user.status === "LOCKED"
                              ? "bg-accent-red-bg text-accent-red"
                              : "bg-subtle text-label"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/settings-administrator-add?id=${user.id}`)}
                        >
                          Edit
                        </Button>
                        {user.status === "LOCKED" ? (
                          <Button variant="outline" size="sm" onClick={() => void unlock(user.id)}>
                            Unlock
                          </Button>
                        ) : null}
                        <Button
                          variant={user.status === "ACTIVE" ? "destructive" : "default"}
                          size="sm"
                          onClick={() => void toggleStatus(user)}
                        >
                          {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
