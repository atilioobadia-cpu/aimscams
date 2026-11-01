"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
  Eye,
  LockOpen,
  Pencil,
  Plus,
  Search,
  UserCheck,
  UserRound,
  UserX,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { RowActionsMenu, type RowAction } from "@/components/data/row-actions-menu";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { UserForm } from "@/components/settings/user-form";
import { ApiError } from "@/lib/api";
import { titleCase } from "@/lib/privacy";
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [showBranchFilter, setShowBranchFilter] = useState(false);
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
  const pageCount = Math.max(1, Math.ceil(users.length / pageSize));
  const pageUsers = users.slice((page - 1) * pageSize, page * pageSize);
  const firstEntry = users.length ? (page - 1) * pageSize + 1 : 0;
  const lastEntry = Math.min(page * pageSize, users.length);

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

  useEffect(() => setPage(1), [q, status, role, branchId, pageSize]);

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
    <div className="flex flex-col gap-[18px]">
      <section className="flex min-h-[90px] shrink-0 items-center rounded-[var(--card-radius)] border border-card-border bg-card px-[var(--space-24)]">
        <UserRound className="mr-3 size-6 text-primary" strokeWidth={1.8} aria-hidden="true" />
        <h1 className="fs-title font-semibold text-heading">User Management</h1>
        {!forbidden ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/settings-administrator-add")}
            className="ml-auto h-[38px] border-primary px-3 text-primary hover:bg-primary-tint hover:text-primary"
          >
            <Plus className="size-4" aria-hidden="true" />
            New User
          </Button>
        ) : null}
      </section>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view users. Ask an administrator for Settings User : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => void load()} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-card">
          <PanelSkeleton rows={6} />
        </section>
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="flex min-h-[71px] flex-wrap items-center gap-4 border-b border-chrome px-[var(--space-12)] py-3">
            <label className="relative block w-[240px] max-w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
              <Input
                aria-label="Search users"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search"
                className="h-[42px] border-primary pl-10 text-primary placeholder:text-primary"
              />
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="h-[42px] min-w-[168px] justify-between border-primary px-3 text-primary hover:bg-primary-tint hover:text-primary">
                  <span className="flex items-center gap-2"><Plus className="size-4" aria-hidden="true" />Add Filters</span>
                  <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuCheckboxItem checked={showStatusFilter} onCheckedChange={setShowStatusFilter}>Status</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showRoleFilter} onCheckedChange={setShowRoleFilter}>Role Name</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showBranchFilter} onCheckedChange={setShowBranchFilter}>Branch</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {status ? <Button variant="ghost" size="sm" onClick={() => setStatus("")}>Clear status</Button> : null}
            {role ? <Button variant="ghost" size="sm" onClick={() => setRole("")}>Clear role</Button> : null}
            {branchId ? <Button variant="ghost" size="sm" onClick={() => setBranchId("")}>Clear branch</Button> : null}
          </div>
          {showStatusFilter || showRoleFilter || showBranchFilter ? (
            <div className="flex flex-wrap gap-3 border-b border-chrome px-[var(--space-12)] py-3">
              {showStatusFilter ? (
                <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-[42px] min-w-[180px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body">
                  <option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="LOCKED">Locked</option>
                </select>
              ) : null}
              {showRoleFilter ? (
                <select aria-label="Filter by role" value={role} onChange={(event) => setRole(event.target.value)} className="h-[42px] min-w-[180px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body">
                  <option value="">All roles</option>{roles.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                </select>
              ) : null}
              {showBranchFilter ? (
                <select aria-label="Filter by branch" value={branchId} onChange={(event) => setBranchId(event.target.value)} className="h-[42px] min-w-[180px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body">
                  <option value="">All branches</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              ) : null}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left fs-text">
              <thead className="border-b border-chrome bg-subtle fs-text font-semibold text-label">
                <tr className="h-[46px]">
                  <th className="w-[17%] px-4 py-2">Email Address</th>
                  <th className="w-[21%] px-4 py-2">Full Name</th>
                  <th className="w-[15%] px-4 py-2">Phone Number</th>
                  <th className="w-[11%] px-4 py-2">Status</th>
                  <th className="px-4 py-2">Role Name</th>
                  <th className="w-14 px-2 py-2 text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {pageUsers.length === 0 ? (
                  <tr><td colSpan={6} className="h-28 px-4 text-center text-muted-foreground">No users match these filters.</td></tr>
                ) : pageUsers.map((user, index) => {
                  const initials = user.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
                  return (
                    <tr key={user.id} className="h-[73px] border-b border-chrome last:border-0">
                      <td className="px-4 py-3 text-body">{maskEmail(user.email)}</td>
                      <td className="px-4 py-3 text-body">
                        <span className="flex items-center gap-3">
                          <span className={`flex size-[46px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${index % 2 ? "from-cyan-500 to-emerald-400" : "from-sky-600 to-cyan-400"} fs-text font-semibold text-white`} aria-hidden="true">{initials || <UserRound className="size-5" />}</span>
                          <span className="truncate">{user.fullName}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-body">{maskPhone(user.phone)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-lg px-2.5 py-1 fs-text font-semibold ${user.status === "ACTIVE" ? "bg-accent-teal-bg text-brand" : user.status === "LOCKED" ? "bg-accent-red-bg text-accent-red" : "bg-subtle text-label"}`}>{titleCase(user.status)}</span>
                      </td>
                      <td className="px-4 py-3 text-body">{user.roles.map((userRole) => userRole.name).join(" , ") || "No role"}</td>
                      <td className="px-2 py-3 text-right"><RowActionsMenu label={user.fullName} actions={actionsFor(user)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex min-h-[60px] flex-wrap items-center justify-center gap-2 border-t border-chrome px-4 py-2 fs-text text-muted-foreground">
            <span className="mr-2">Showing {firstEntry} to {lastEntry} of {users.length} entries</span>
            <Button type="button" variant="ghost" size="icon-sm" className="size-[42px] rounded-full" aria-label="First page" onClick={() => setPage(1)} disabled={page <= 1}><ChevronFirst className="size-4" /></Button>
            <Button type="button" variant="ghost" size="icon-sm" className="size-[42px] rounded-full" aria-label="Previous page" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}><ChevronLeft className="size-4" /></Button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <Button key={pageNumber} type="button" variant={pageNumber === page ? "secondary" : "ghost"} size="icon-sm" className="size-[42px] rounded-full" aria-current={pageNumber === page ? "page" : undefined} onClick={() => setPage(pageNumber)}>{pageNumber}</Button>)}
            <Button type="button" variant="ghost" size="icon-sm" className="size-[42px] rounded-full" aria-label="Next page" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page >= pageCount}><ChevronRight className="size-4" /></Button>
            <Button type="button" variant="ghost" size="icon-sm" className="size-[42px] rounded-full" aria-label="Last page" onClick={() => setPage(pageCount)} disabled={page >= pageCount}><ChevronLast className="size-4" /></Button>
            <select aria-label="Rows per page" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="ml-2 h-11 w-[90px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body">
              {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
        </section>
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
            <Detail label="Status" value={titleCase(viewingUser.status)} />
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
