"use client";

import { useEffect, useState } from "react";
import { Box, Plus, Search, SlidersHorizontal } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api";
import { createAssetType, listAssetTypes, listFixedAssets, type AssetType, type FixedAsset } from "@/lib/accounting";
import { titleCase } from "@/lib/privacy";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load asset types.";
}

export function AssetTypesPage() {
  const [items, setItems] = useState<AssetType[]>([]);
  const [allocations, setAllocations] = useState<FixedAsset[]>([]);
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
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"types" | "allocations">("types");
  const [allocationType, setAllocationType] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void Promise.allSettled([listAssetTypes(), listFixedAssets()])
        .then(([typesResult, allocationsResult]) => {
          if (cancelled) return;
          if (typesResult.status === "fulfilled") {
            setItems(typesResult.value);
            setForbidden(false);
          } else if (typesResult.reason instanceof ApiError && typesResult.reason.status === 403) {
            setForbidden(true);
            setItems([]);
          } else {
            setError(failureMessage(typesResult.reason));
          }
          setAllocations(allocationsResult.status === "fulfilled" ? allocationsResult.value : []);
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
      setCreateOpen(false);
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
  const filteredAllocations = allocations.filter((item) => {
    const q = query.trim().toLowerCase();
    const matchesText = !q || item.description.toLowerCase().includes(q) || item.assetNo.toLowerCase().includes(q);
    return matchesText && (!allocationType || item.assetType?.name === allocationType);
  });

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader variant="card" title="Assets" icon={<Box className="size-6 text-primary" aria-hidden="true" />} actions={<Button variant="outline" onClick={() => setCreateOpen(true)}><Plus className="size-4" aria-hidden="true" />Add Asset Type</Button>} />
        <ForbiddenPanel message="Your role cannot view asset types. Ask an administrator for Settings Accounting : View." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader variant="card" title="Assets" icon={<Box className="size-6 text-primary" aria-hidden="true" />} actions={<Button variant="outline" onClick={() => setCreateOpen(true)}><Plus className="size-4" aria-hidden="true" />Add Asset Type</Button>} />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Asset Type" size="large" unsaved={Boolean(code || name || description)}>
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
      </Modal>

      <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
        <div role="tablist" aria-label="Asset sections" className="flex h-[44px] items-stretch border-b border-chrome bg-subtle px-2">
          <button type="button" role="tab" aria-selected={activeTab === "types"} onClick={() => { setActiveTab("types"); setQuery(""); }} className={`-mb-px border-b-2 px-4 fs-text font-medium transition-colors ${activeTab === "types" ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-strong"}`}>Asset Type</button>
          <button type="button" role="tab" aria-selected={activeTab === "allocations"} onClick={() => { setActiveTab("allocations"); setQuery(""); }} className={`-mb-px border-b-2 px-4 fs-text font-medium transition-colors ${activeTab === "allocations" ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-strong"}`}>Asset Allocation</button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-chrome px-3 py-2.5">
          <label className="relative min-w-[220px] flex-1 sm:max-w-[360px]">
            <span className="sr-only">Search by {activeTab === "types" ? "name" : "name or asset ID"}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="asset-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={activeTab === "types" ? "Filter by Name" : "Search assets"} className="h-9 pl-9" />
          </label>
          {activeTab === "allocations" ? (
            <>
              <label className="sr-only" htmlFor="asset-type-filter">Filter by Asset Type</label>
              <select id="asset-type-filter" value={allocationType} onChange={(event) => setAllocationType(event.target.value)} className="h-9 min-w-[150px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body">
                <option value="">All asset types</option>
                {items.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
              </select>
            </>
          ) : null}
        </div>
        {loading ? (
          <PanelSkeleton rows={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full ${activeTab === "types" ? "min-w-[760px]" : "min-w-[1450px]"} text-left fs-text`}>
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                {activeTab === "types" ? <tr><th className="whitespace-nowrap px-4 py-3">Name</th><th className="whitespace-nowrap px-4 py-3">Ledger</th><th className="w-12 px-4 py-3 text-center"><span className="sr-only">Actions</span><SlidersHorizontal className="mx-auto size-4" aria-hidden="true" /></th></tr> : <tr><th className="whitespace-nowrap px-4 py-3">External Asset ID</th><th className="whitespace-nowrap px-4 py-3">Name</th><th className="whitespace-nowrap px-4 py-3">Asset Type</th><th className="whitespace-nowrap px-4 py-3">Asset Status</th><th className="whitespace-nowrap px-4 py-3">Serial Number</th><th className="whitespace-nowrap px-4 py-3">Supplier Name</th><th className="whitespace-nowrap px-4 py-3">Supplier Address</th><th className="whitespace-nowrap px-4 py-3">Supplier Company</th><th className="whitespace-nowrap px-4 py-3">Entry Date</th><th className="whitespace-nowrap px-4 py-3">Department</th><th className="whitespace-nowrap px-4 py-3">User</th><th className="w-12 px-4 py-3 text-center"><span className="sr-only">Actions</span><SlidersHorizontal className="mx-auto size-4" aria-hidden="true" /></th></tr>}
              </thead>
              <tbody>
                {activeTab === "types" ? filtered.length === 0 ? <tr><td colSpan={3} className="px-4 py-16 text-center fs-text text-muted-foreground">{query ? "No data available for the selected search." : "No data available"}</td></tr> : filtered.map((item) => <tr key={item.id} className="border-b border-card-border last:border-0"><td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.name}</td><td className="whitespace-nowrap px-4 py-3 text-body">—</td><td className="px-4 py-3" /></tr>) : filteredAllocations.length === 0 ? <tr><td colSpan={12} className="px-4 py-16 text-center fs-text text-muted-foreground">No data available</td></tr> : filteredAllocations.map((item) => <tr key={item.id} className="border-b border-card-border last:border-0"><td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.assetNo}</td><td className="whitespace-nowrap px-4 py-3 text-body">{item.description}</td><td className="whitespace-nowrap px-4 py-3 text-body">{item.assetType?.name ?? "—"}</td><td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(item.status)}</td><td className="px-4 py-3 text-body">—</td><td className="px-4 py-3 text-body">—</td><td className="px-4 py-3 text-body">—</td><td className="px-4 py-3 text-body">—</td><td className="whitespace-nowrap px-4 py-3 text-body">{new Date(item.acquisitionDate).toLocaleDateString()}</td><td className="px-4 py-3 text-body">—</td><td className="px-4 py-3 text-body">—</td><td className="px-4 py-3" /></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
