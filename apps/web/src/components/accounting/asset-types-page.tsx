"use client";

import { useEffect, useState } from "react";
import { Box, Search } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { createAssetType, listAssetTypes, type AssetType } from "@/lib/accounting";
import { titleCase } from "@/lib/privacy";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load asset types.";
}

export function AssetTypesPage() {
  const [items, setItems] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState("STRAIGHT_LINE");
  const [life, setLife] = useState("0");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listAssetTypes()
        .then((next) => {
          if (cancelled) return;
          setItems(next);
          setForbidden(false);
        })
        .catch((failure: unknown) => {
          if (cancelled) return;
          if (failure instanceof ApiError && failure.status === 403) {
            setForbidden(true);
            setItems([]);
          } else {
            setError(failureMessage(failure));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reloadKey]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await createAssetType({
        code,
        name,
        description: description || undefined,
        depreciationMethod: method,
        usefulLifeMonths: Number(life) || 0,
      });
      setCode("");
      setName("");
      setDescription("");
      setLife("0");
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setCreateError(failureMessage(failure));
    } finally {
      setCreating(false);
    }
  }

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
  });

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Asset types" description="Categories for the fixed-asset register." />
        <ForbiddenPanel message="Your role cannot view asset types. Ask an administrator for Settings Accounting : View." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Asset types" description="Categories for the fixed-asset register." />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <h2 className="mb-3 fs-text font-bold text-strong">Add asset type</h2>
        <form className="space-y-3" onSubmit={handleCreate}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-code">Code</label>
              <Input id="asset-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="FURN" className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-name">Name</label>
              <Input id="asset-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Furniture" className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-method">Depreciation method</label>
              <select id="asset-method" value={method} onChange={(event) => setMethod(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text">
                <option value="STRAIGHT_LINE">Straight line</option>
                <option value="REDUCING_BALANCE">Reducing balance</option>
                <option value="NONE">None</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-life">Useful life (months)</label>
              <Input id="asset-life" value={life} onChange={(event) => setLife(event.target.value)} placeholder="0" className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-description">Description</label>
              <Input id="asset-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional" className="h-[var(--control-height)]" />
            </div>
          </div>
          {createError ? <p className="fs-text text-accent-red" role="alert">{createError}</p> : null}
          <Button type="submit" disabled={creating || !code || !name}>{creating ? "Saving..." : "Add asset type"}</Button>
        </form>
      </section>

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-search">Search</label>
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="asset-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Code or name" className="h-[var(--control-height)] pl-9" />
            </div>
          </div>
        </div>
        {loading ? (
          <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
            <PanelSkeleton rows={6} />
          </section>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Box} title={query ? "No asset types match" : "No asset types yet"} description={query ? "Adjust the search." : "Add an asset type to start the fixed-asset register."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Code</th>
                  <th className="whitespace-nowrap px-4 py-3">Name</th>
                  <th className="whitespace-nowrap px-4 py-3">Depreciation method</th>
                  <th className="whitespace-nowrap px-4 py-3">Useful life (months)</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                  <th className="whitespace-nowrap px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.code}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(item.depreciationMethod.replace(/_/g, " "))}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{item.usefulLifeMonths}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{titleCase(item.status)}</Badge></td>
                    <td className="px-4 py-3 text-body">{item.description ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
