"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { RowActionsMenu } from "@/components/data/row-actions-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createRole,
  listRolePermissions,
  listRoles,
  updateRole,
  type RoleSummary,
} from "@/lib/users";

function groupPermissions(keys: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const key of keys) {
    const entity = key.split(" : ")[0] ?? key;
    if (!groups[entity]) groups[entity] = [];
    groups[entity].push(key);
  }
  return groups;
}

function codeLabel(code: string): string {
  return code
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}

function roleCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState<"name" | "displayName">("name");
  const [showDisplayName, setShowDisplayName] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTab, setCreateTab] = useState<"details" | "permissions" | "history">("details");
  const [newCodeName, setNewCodeName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [editor, setEditor] = useState<RoleSummary | null>(null);
  const [editorName, setEditorName] = useState("");
  const [editorDescription, setEditorDescription] = useState("");
  const [editorPermissions, setEditorPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function refreshRoles() {
    const [data, permissionCatalog] = await Promise.all([listRoles(), listRolePermissions()]);
    setRoles(data);
    setPermissions(permissionCatalog);
  }

  useEffect(() => {
    let active = true;
    Promise.all([listRoles(), listRolePermissions()])
      .then(([data, permissionCatalog]) => {
        if (!active) return;
        setRoles(data);
        setPermissions(permissionCatalog);
        setLoading(false);
      })
      .catch((failure: unknown) => {
        if (!active) return;
        setError(failure instanceof Error ? failure.message : "Could not load roles.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredRoles = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return [...roles]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((role) => {
        const value = filterField === "name" ? (role.isSystem ? role.name : codeLabel(role.code)) : role.name;
        return !needle || value.toLowerCase().includes(needle);
      });
  }, [filterField, roles, search]);

  const pageCount = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  const pageRoles = filteredRoles.slice((page - 1) * pageSize, page * pageSize);
  const firstEntry = filteredRoles.length ? (page - 1) * pageSize + 1 : 0;
  const lastEntry = Math.min(page * pageSize, filteredRoles.length);
  const grouped = useMemo(() => groupPermissions(permissions), [permissions]);

  useEffect(() => { const timer = window.setTimeout(() => setPage(1), 0); return () => window.clearTimeout(timer); }, [search, filterField, pageSize]);

  function openEditor(role: RoleSummary) {
    setEditor(role);
    setEditorName(role.name);
    setEditorDescription(role.description ?? "");
    setEditorPermissions(role.permissionKeys);
    setFormError(null);
  }

  function togglePermission(
    key: string,
    current: string[],
    setCurrent: (value: string[]) => void,
  ) {
    setCurrent(current.includes(key) ? current.filter((value) => value !== key) : [...current, key]);
  }

  async function submitNewRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = roleCode(newCodeName);
    if (!code) {
      setFormError("Enter a role name.");
      setCreateTab("details");
      return;
    }
    if (!newDisplayName.trim()) {
      setFormError("Enter a display name.");
      setCreateTab("details");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await createRole({
        code,
        name: newDisplayName.trim(),
        description: newDescription.trim() || null,
        permissionKeys: newPermissions,
      });
      await refreshRoles();
      setCreateOpen(false);
      setNewCodeName("");
      setNewDisplayName("");
      setNewDescription("");
      setNewPermissions([]);
      setCreateTab("details");
    } catch (failure) {
      setFormError(failure instanceof Error ? failure.message : "Could not create the role.");
    } finally {
      setSaving(false);
    }
  }

  async function saveRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    setSaving(true);
    setFormError(null);
    try {
      const updated = await updateRole(editor.id, {
        name: editorName.trim(),
        description: editorDescription.trim() || null,
        permissionKeys: editorPermissions,
      });
      setRoles((current) => current.map((role) => role.id === updated.id ? updated : role));
      setEditor(null);
    } catch (failure) {
      setFormError(failure instanceof Error ? failure.message : "Could not update the role.");
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: "details", label: "Details" },
    { id: "permissions", label: "Permissions" },
    { id: "history", label: "Audit history" },
  ] as const;

  return (
    <div className="flex flex-col gap-[13.44px]">
      <section className="flex min-h-[70px] shrink-0 items-start rounded-[var(--card-radius)] border border-card-border bg-card px-[20.16px] py-[20.16px]">
        <Shield className="mr-3 size-6 text-primary" strokeWidth={1.8} aria-hidden="true" />
        <h1 className="text-[20.16px] font-semibold leading-[normal] text-heading">Role Management</h1>
        <Button
          type="button"
          variant="outline"
          onClick={() => { setCreateOpen(true); setFormError(null); }}
          className="ml-auto h-[28.77px] rounded-[6px] border-primary !bg-transparent px-[8.4px] py-[6.72px] !text-[11.76px] text-primary hover:bg-primary-tint hover:text-primary"
        >
          <Plus className="size-4" aria-hidden="true" />
          New Role
        </Button>
      </section>

      <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="flex min-h-[56px] flex-wrap items-center gap-4 border-b border-chrome px-[13.44px] py-[6.72px]">
          <label className="relative block w-[240px] max-w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
            <Input
              aria-label={`Search by ${filterField === "name" ? "role name" : "display name"}`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
              <DropdownMenuItem onSelect={() => setFilterField("name")}>Role Name</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFilterField("displayName")}>Display Name</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {search ? (
            <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="gap-1 text-muted-foreground">
              <X className="size-3.5" aria-hidden="true" />Clear
            </Button>
          ) : null}

        </div>

        {error ? (
          <div role="alert" className="m-4 rounded-[var(--card-radius)] border border-destructive/30 bg-destructive/5 p-4 fs-text text-destructive">{error}</div>
        ) : loading ? (
          <div className="p-6 fs-text text-muted-foreground">Loading roles...</div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-subtle">
                <TableRow className="h-[37.48px] bg-subtle hover:bg-subtle">
                  <TableHead className="w-[44%] !px-[13.44px] !py-[10.08px] fs-text !font-bold !text-heading leading-[normal]" style={{height:"37.48px",minHeight:"37.48px",maxHeight:"37.48px",lineHeight:"normal",overflow:"hidden"}}>Role Name</TableHead>
                  {showDisplayName ? <TableHead className="!px-[13.44px] !py-[10.08px] fs-text !font-bold !text-heading leading-[normal]" style={{height:"37.48px",minHeight:"37.48px",maxHeight:"37.48px",lineHeight:"normal",overflow:"hidden"}}>Display Name</TableHead> : null}
                  <TableHead className="w-20 !px-[13.44px] !py-[10.08px] text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon-sm" aria-label="Table columns" className="text-primary">
                          <SlidersHorizontal className="size-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuCheckboxItem checked={showDisplayName} onCheckedChange={setShowDisplayName}>Display Name</DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRoles.map((role) => (
                  <TableRow key={role.id} className="h-[52.27px] border-b border-chrome bg-white [&>td]:!py-[10.08px]">
                    <TableCell className="!px-[13.44px] !py-[10.08px] fs-text !text-heading">{role.isSystem ? role.name : codeLabel(role.code)}</TableCell>
                    {showDisplayName ? <TableCell className="!px-[13.44px] !py-[10.08px] fs-text !text-heading">{role.name}</TableCell> : null}
                    <TableCell className="w-20 bg-subtle/40 px-[13.44px] !py-[10.08px] text-right">
                      <RowActionsMenu
                        label={role.name}
                        actions={[
                          { label: "Edit role", onSelect: () => openEditor(role) },
                          { label: "Manage permissions", onSelect: () => openEditor(role) },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {pageRoles.length === 0 ? (
                  <TableRow><TableCell colSpan={showDisplayName ? 3 : 2} className="h-28 text-center fs-text text-muted-foreground">No roles match your search.</TableCell></TableRow>
                ) : null}
              </TableBody>
            </Table>

            <div className="flex min-h-[48px] flex-wrap items-center justify-center gap-[3.36px] border-t border-chrome bg-white px-[13.44px] py-[6.72px] fs-text text-heading" style={{borderRadius:"6px"}}>
              <span className="mr-2">Showing {firstEntry} to {lastEntry} of {filteredRoles.length} entries</span>
              <Button variant="ghost" size="icon-sm" className="size-[42px] rounded-full" aria-label="First page" onClick={() => setPage(1)} disabled={page <= 1}><ChevronFirst className="size-4" /></Button>
              <Button variant="ghost" size="icon-sm" className="size-[42px] rounded-full" aria-label="Previous page" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}><ChevronLeft className="size-4" /></Button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                <Button key={pageNumber} variant={pageNumber === page ? "secondary" : "ghost"} size="icon-sm" className="size-[42px] rounded-full" aria-current={pageNumber === page ? "page" : undefined} onClick={() => setPage(pageNumber)}>{pageNumber}</Button>
              ))}
              <Button variant="ghost" size="icon-sm" className="size-[42px] rounded-full" aria-label="Next page" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page >= pageCount}><ChevronRight className="size-4" /></Button>
              <Button variant="ghost" size="icon-sm" className="size-[42px] rounded-full" aria-label="Last page" onClick={() => setPage(pageCount)} disabled={page >= pageCount}><ChevronLast className="size-4" /></Button>
              <select aria-label="Rows per page" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} style={{ width: "90px" }} className="ml-2 h-11 rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body">
                {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
          </>
        )}
      </section>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create new role"
        size="wide"
        unsaved={Boolean(newCodeName || newDisplayName || newDescription || newPermissions.length)}
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="border-primary text-primary"><X className="size-4" />Cancel</Button>
            <Button type="submit" form="create-role-form" disabled={saving || !newCodeName.trim() || !newDisplayName.trim()} className="bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"><Check className="size-4" />{saving ? "Saving..." : "Save"}</Button>
          </>
        )}
      >
        <form id="create-role-form" onSubmit={submitNewRole} className="min-h-[390px]">
          <div role="tablist" aria-label="New role sections" className="mb-5 flex border-b border-chrome">
            {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={createTab === tab.id} onClick={() => setCreateTab(tab.id)} className={`px-4 py-3 fs-text font-medium ${createTab === tab.id ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-heading"}`}>{tab.label}</button>)}
          </div>
          {formError ? <p role="alert" className="mb-4 fs-text text-destructive">{formError}</p> : null}
          {createTab === "details" ? (
            <div className="space-y-4">
              <label className="block space-y-1.5 fs-text font-medium text-body">Name <span className="text-destructive">*</span><Input required value={newCodeName} onChange={(event) => { setNewCodeName(event.target.value); if (!newDisplayName) setNewDisplayName(event.target.value); }} autoComplete="off" /></label>
              <label className="block space-y-1.5 fs-text font-medium text-body">Display Name <span className="text-destructive">*</span><Input required value={newDisplayName} onChange={(event) => setNewDisplayName(event.target.value)} autoComplete="off" /></label>
              <label className="block space-y-1.5 fs-text font-medium text-body">Role description<textarea value={newDescription} onChange={(event) => setNewDescription(event.target.value)} rows={3} className="w-full rounded-[var(--control-radius)] border border-input bg-background px-3 py-2 fs-text outline-none focus-visible:ring-2 focus-visible:ring-ring/50" /></label>
            </div>
          ) : createTab === "permissions" ? (
            <div className="max-h-[55vh] overflow-y-auto">
              <PermissionGroups groups={grouped} checked={newPermissions} onToggle={(key) => togglePermission(key, newPermissions, setNewPermissions)} onToggleAll={() => setNewPermissions(newPermissions.length === permissions.length ? [] : permissions)} />
            </div>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center text-center fs-text text-muted-foreground"><Clock3 className="mb-3 size-8" aria-hidden="true" /><strong className="text-heading">History</strong><span>No history records found.</span></div>
          )}
        </form>
      </Modal>

      <Modal
        open={editor !== null}
        onClose={() => setEditor(null)}
        title={editor ? `Edit ${editor.name}` : "Edit role"}
        size="wide"
        unsaved={Boolean(editor && (editorName !== editor.name || editorDescription !== (editor.description ?? "") || JSON.stringify(editorPermissions) !== JSON.stringify(editor.permissionKeys)))}
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => setEditor(null)} className="border-primary text-primary"><X className="size-4" />Cancel</Button>
            <Button type="submit" form="edit-role-form" disabled={saving} className="bg-primary text-primary-foreground"><Check className="size-4" />{saving ? "Saving..." : "Save"}</Button>
          </>
        )}
      >
        <form id="edit-role-form" onSubmit={saveRole}>
          {formError ? <p role="alert" className="mb-4 fs-text text-destructive">{formError}</p> : null}
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 fs-text font-medium text-body">Name<Input value={editor ? (editor.isSystem ? editor.name : codeLabel(editor.code)) : ""} disabled /></label>
            <label className="block space-y-1.5 fs-text font-medium text-body">Display Name<Input required value={editorName} onChange={(event) => setEditorName(event.target.value)} /></label>
          </div>
          <label className="mb-5 block space-y-1.5 fs-text font-medium text-body">Role description<textarea value={editorDescription} onChange={(event) => setEditorDescription(event.target.value)} rows={2} className="w-full rounded-[var(--control-radius)] border border-input bg-background px-3 py-2 fs-text outline-none focus-visible:ring-2 focus-visible:ring-ring/50" /></label>
          <h3 className="mb-3 fs-text font-semibold text-heading">Permissions</h3>
          <div className="max-h-[45vh] overflow-y-auto"><PermissionGroups groups={grouped} checked={editorPermissions} onToggle={(key) => togglePermission(key, editorPermissions, setEditorPermissions)} onToggleAll={() => setEditorPermissions(editorPermissions.length === permissions.length ? [] : permissions)} /></div>
        </form>
      </Modal>
    </div>
  );
}

function PermissionGroups({
  groups,
  checked,
  onToggle,
  onToggleAll,
}: {
  groups: Record<string, string[]>;
  checked: string[];
  onToggle: (key: string) => void;
  onToggleAll: () => void;
}) {
  const keys = Object.values(groups).flat();
  const allSelected = keys.length > 0 && keys.every((key) => checked.includes(key));
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
      <label className="col-span-full flex items-center gap-2 fs-text text-body"><input type="checkbox" checked={allSelected} onChange={onToggleAll} className="size-4 accent-[var(--primary)]" />Select All</label>
      {keys.map((key) => <label key={key} className="flex items-center gap-2 fs-text text-body"><input type="checkbox" checked={checked.includes(key)} onChange={() => onToggle(key)} className="size-4 accent-[var(--primary)]" />{key.replace(" : ", ": ")}</label>)}
    </div>
  );
}
