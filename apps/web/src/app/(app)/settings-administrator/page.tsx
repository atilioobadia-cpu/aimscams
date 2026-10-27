"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, LockOpen, Pencil, UserCheck, UserX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { RowActionsMenu, type RowAction } from "@/components/data/row-actions-menu";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { UserForm } from "@/components/settings/user-form";
import { ApiError } from "@/lib/api";
import { maskEmail, maskPhone } from "@/lib/privacy";
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
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [branchId, setBranchId] = useState("");
  const queryModal = searchParams.get("modal");
  const queryId = searchParams.get("id") ?? undefined;
  const [manualModal, setManualModal] = useState<{ id?: string } | null>(null);
  const [viewingUser, setViewingUser] = useState<UserSummary | null>(null);
  const { pushToast } = useToast();

  // Old create/edit URLs redirect here with ?modal=create|edit, so the query is a
  // second source of truth for the dialog. No effect, so no cascading render.
  const editingId = manualModal ? manualModal.id : queryModal === "edit" ? queryId : undefined;
  const modalOpen =
    manualModal !== null || queryModal === "create" || (queryModal === "edit" && Boolean(queryId));

  function closeModal() {
    setManualModal(null);
    if (queryModal) {
      router.replace("/settings-administrator");
    }
  }

  const filters = useMemo(
    () => ({ q, status: status || undefined, role: role || undefined, branchId: branchId || undefined }),
    [q, status, role, branchId],
  );

  async function load() {
    setError(null);
    setForbidden(false);
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
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
        setUsers([]);
      } else {
        setError(err instanceof Error ? err.message : "Could not load users.");
      }
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
        setError(null);
        setForbidden(false);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true);
          setUsers([]);
        } else {
          setError(err instanceof Error ? err.message : "Could not load users.");
        }
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
      pushToast(`${user.fullName} ${next === "ACTIVE" ? "activated" : "deactivated"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update user.");
    }
  }

  async function unlock(id: string) {
    try {
      await unlockUser(id);
      await load();
      pushToast("User unlocked.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unlock user.");
    }
  }

  function actionsFor(user: UserSummary): RowAction[] {
    const actions: RowAction[] = [
      { label: "View user", icon: Eye, onSelect: () => setViewingUser(user) },
      {
        label: "Edit user",
        icon: Pencil,
        onSelect: () => setManualModal({ id: user.id }),
      },
    ];

    if (user.status === "LOCKED") {
      actions.push({
        label: "Unlock user",
        icon: LockOpen,
        onSelect: () => void unlock(user.id),
        separatorBefore: true,
      });
    }

    actions.push({
      label: user.status === "ACTIVE" ? "Deactivate user" : "Activate user",
      icon: user.status === "ACTIVE" ? UserX : UserCheck,
      onSelect: () => void toggleStatus(user),
      variant: user.status === "ACTIVE" ? "destructive" : "default",
      separatorBefore: true,
    });

    return actions;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="fs-text font-bold leading-tight text-strong">Users</h1>
          <p className="mt-1 max-w-3xl fs-text text-muted-foreground">
            Institution accounts, roles and branch access.
          </p>
        </div>
        {!forbidden ? (
          <Button
            className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold"
            onClick={() => {
              setManualModal({});
            }}
          >
            Add user
          </Button>
        ) : null}
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
            className="h-[var(--control-height)] rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LOCKED">Locked</option>
          </select>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="h-[var(--control-height)] rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
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
            className="h-[var(--control-height)] rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
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

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view users. Ask an administrator for Settings User : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => void load()} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={6} />
        </section>
      ) : (
        <div className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
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
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No users match these filters.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-card-border last:border-0">
                      <td className="px-4 py-3 font-medium text-strong">{user.fullName}</td>
                      <td className="px-4 py-3 text-body">{maskEmail(user.email)}</td>
                      <td className="px-4 py-3 text-body">{user.branch?.name ?? "Institution"}</td>
                      <td className="px-4 py-3 text-body">
                        {user.roles.map((role) => role.name).join(", ") || "No role"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 fs-text font-normal ${
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
                        <div className="flex justify-end">
                          <RowActionsMenu label={user.fullName} actions={actionsFor(user)} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Modal open={modalOpen} onClose={closeModal} title={editingId ? "Edit user" : "Add user"}>
        <UserForm id={editingId} />
      </Modal>

      <Modal
        open={Boolean(viewingUser)}
        onClose={() => setViewingUser(null)}
        title="User details"
        footer={
          <Button variant="outline" onClick={() => setViewingUser(null)}>
            Close
          </Button>
        }
      >
        {viewingUser ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Full name" value={viewingUser.fullName} />
            <Detail label="Email" value={maskEmail(viewingUser.email)} />
            <Detail label="Phone" value={maskPhone(viewingUser.phone)} />
            <Detail label="Branch" value={viewingUser.branch?.name ?? "Institution"} />
            <Detail label="Status" value={viewingUser.status} />
            <Detail
              label="Roles"
              value={viewingUser.roles.map((role) => role.name).join(", ") || "No role"}
            />
            <Detail label="Created" value={formatDate(viewingUser.createdAt)} />
            <Detail label="Last updated" value={formatDate(viewingUser.updatedAt)} />
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(value: string): string {
  return dateFormat.format(new Date(value));
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="fs-text font-medium tracking-wide text-label">{label}</dt>
      <dd className="mt-0.5 fs-text text-body">{value}</dd>
    </div>
  );
}
