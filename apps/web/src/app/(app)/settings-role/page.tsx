"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listRoles, updateRole, type RoleSummary } from "@/lib/users";

type GroupedPermissions = Record<string, string[]>;

function groupPermissions(keys: string[]): GroupedPermissions {
  const groups: GroupedPermissions = {};
  for (const key of keys) {
    const entity = key.split(" : ")[0] ?? key;
    if (!groups[entity]) groups[entity] = [];
    groups[entity].push(key);
  }
  return groups;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const allPermissionKeys = useMemo(() => {
    const set = new Set<string>();
    for (const role of roles) for (const key of role.permissionKeys) set.add(key);
    return [...set].sort();
  }, [roles]);

  const grouped = useMemo(() => groupPermissions(allPermissionKeys), [allPermissionKeys]);

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null;

  useEffect(() => {
    let active = true;
    listRoles()
      .then((data) => {
        if (!active) return;
        setRoles(data);
        if (data.length > 0) {
          setSelectedRoleId(data[0].id);
          setDraftPermissions(data[0].permissionKeys);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load roles.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function togglePermission(key: string) {
    setDraftPermissions((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  async function save() {
    if (!selectedRole) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateRole(selectedRole.id, { permissionKeys: draftPermissions });
      setRoles((current) => current.map((role) => (role.id === updated.id ? updated : role)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save role.");
    } finally {
      setSaving(false);
    }
  }

  const filteredGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const result: GroupedPermissions = {};
    for (const [entity, keys] of Object.entries(grouped)) {
      const filtered = needle
        ? keys.filter((key) => key.toLowerCase().includes(needle))
        : keys;
      if (filtered.length > 0) result[entity] = filtered;
    }
    return result;
  }, [grouped, search]);

  if (loading) {
    return <p className="fs-text text-muted-foreground">Loading roles...</p>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <div className="space-y-3">
        <h1 className="fs-text font-bold leading-tight text-strong">Roles</h1>
        <p className="fs-text text-muted-foreground">
          Permission matrix for the 17 institution roles.
        </p>
        <div className="space-y-2">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => {
                setSelectedRoleId(role.id);
                const found = roles.find((item) => item.id === role.id);
                if (found) setDraftPermissions(found.permissionKeys);
              }}
              className={`w-full rounded-lg border px-3 py-2 text-left fs-text transition-colors ${
                role.id === selectedRoleId
                  ? "border-brand bg-accent-teal-bg"
                  : "border-card-border bg-surface hover:bg-subtle"
              }`}
            >
              <span className="block font-semibold text-strong">{role.name}</span>
              <span className="block fs-text text-muted-foreground">
                {role.code} · {role.userCount} users
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-accent-red-bg bg-accent-red-bg px-4 py-3 fs-text text-accent-red">
            {error}
          </div>
        ) : null}

        {selectedRole ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="fs-text font-bold text-strong">{selectedRole.name}</h2>
                <p className="fs-text text-muted-foreground">{selectedRole.description}</p>
              </div>
              <Button onClick={() => void save()} disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
                {saving ? "Saving..." : "Save permissions"}
              </Button>
            </div>

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter permissions"
              className="h-[var(--control-height)] max-w-sm"
            />

            <div className="space-y-4">
              {Object.entries(filteredGroups).map(([entity, keys]) => (
                <div key={entity} className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
                  <p className="mb-[var(--space-8)] fs-text font-semibold text-strong">{entity}</p>
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {keys.map((key) => {
                      const action = key.split(" : ")[1] ?? key;
                      return (
                        <label key={key} className="flex items-center gap-2 fs-text text-body">
                          <input
                            type="checkbox"
                            checked={draftPermissions.includes(key)}
                            onChange={() => togglePermission(key)}
                            className="size-4"
                          />
                          {action}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="fs-text text-muted-foreground">Select a role to edit its permissions.</p>
        )}
      </div>
    </div>
  );
}
