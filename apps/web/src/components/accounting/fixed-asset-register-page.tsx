"use client";

import { useEffect, useState } from "react";
import { Box, Download, Plus, Search, SlidersHorizontal } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { EmptyState } from "@/components/data/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api";
import { createFixedAsset, listAssetTypes, listFixedAssets, type AssetType, type FixedAsset } from "@/lib/accounting";
import { formatTzs } from "@/lib/format";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load fixed assets.";
}

export function FixedAssetRegisterPage() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assetNo, setAssetNo] = useState("");
  const [description, setDescription] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().slice(0, 10));
  const [cost, setCost] = useState("");
  const [assetTypeId, setAssetTypeId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void Promise.all([listFixedAssets(), listAssetTypes()])
        .then(([assetList, typeList]) => {
          if (cancelled) return;
          setAssets(assetList);
          setAssetTypes(typeList);
          setForbidden(false);
        })
        .catch((failure: unknown) => {
          if (cancelled) return;
          if (failure instanceof ApiError && failure.status === 403) {
            setForbidden(true);
            setAssets([]);
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
      await createFixedAsset({
        assetNo,
        description,
        acquisitionDate,
        acquisitionCostMinor: cost,
        assetTypeId: assetTypeId || undefined,
      });
      setAssetNo("");
      setDescription("");
      setCost("");
      setCreateOpen(false);
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setCreateError(failureMessage(failure));
    } finally {
      setCreating(false);
    }
  }

  const filtered = assets.filter((item) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || item.assetNo.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    return matchesQuery && (!statusFilter || item.status === statusFilter);
  });

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader variant="card" title="Fixed Assets" icon={<Box className="size-6 text-primary" aria-hidden="true" />} actions={<Button variant="outline" onClick={() => setCreateOpen(true)}><Plus className="size-4" aria-hidden="true" />Add Fixed Asset</Button>} />
        <ForbiddenPanel message="Your role cannot view fixed assets. Ask an administrator for Settings Accounting : View." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader variant="card" title="Fixed Assets" icon={<Box className="size-6 text-primary" aria-hidden="true" />} actions={<div className="flex items-center gap-2"><Button variant="outline" disabled title="Bulk import is not available for local fixed assets yet."><Download className="size-4" aria-hidden="true" />Import</Button><Button variant="outline" onClick={() => setCreateOpen(true)}><Plus className="size-4" aria-hidden="true" />Add Fixed Asset</Button></div>} />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Fixed Asset" size="large" unsaved={Boolean(assetNo || description || cost)}>
        <form className="space-y-3" onSubmit={handleCreate}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-no">Asset / Invoice Number</label>
              <Input id="asset-no" value={assetNo} onChange={(event) => setAssetNo(event.target.value)} placeholder="FA-0001" className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-desc">Asset name</label>
              <Input id="asset-desc" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Enter asset name" className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-date">Asset Purchase Date</label>
              <Input id="asset-date" type="date" value={acquisitionDate} onChange={(event) => setAcquisitionDate(event.target.value)} className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-cost">Asset Value</label>
              <Input id="asset-cost" value={cost} onChange={(event) => setCost(event.target.value)} placeholder="Enter asset value" className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-type">Asset Type</label>
              <select id="asset-type" value={assetTypeId} onChange={(event) => setAssetTypeId(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text">
                <option value="">None</option>
                {assetTypes.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>
          {createError ? <p className="fs-text text-accent-red" role="alert">{createError}</p> : null}
          <Button type="submit" disabled={creating || !assetNo || !description || !cost}>{creating ? "Saving..." : "Register asset"}</Button>
        </form>
      </Modal>

      <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-chrome px-3 py-2.5">
          <label className="relative min-w-[220px] flex-1 sm:max-w-[360px]">
            <span className="sr-only">Search fixed assets</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="asset-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets" className="h-9 pl-9" />
          </label>
          <label className="sr-only" htmlFor="asset-status-filter">Filter by asset status</label>
          <select id="asset-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 min-w-[130px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body">
            <option value="">Show all</option>
            <option value="ACTIVE">Active</option>
            <option value="DISPOSED">Disposed</option>
          </select>
        </div>
        {loading ? (
          <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
            <PanelSkeleton rows={6} />
          </section>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Asset Name</th>
                  <th className="whitespace-nowrap px-4 py-3">Asset Number</th>
                  <th className="whitespace-nowrap px-4 py-3">Asset Type</th>
                  <th className="whitespace-nowrap px-4 py-3">Purchase Date</th>
                  <th className="whitespace-nowrap px-4 py-3">Entry Date</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Purchase Price (TSh)</th>
                  <th className="w-12 px-4 py-3 text-center"><span className="sr-only">Actions</span><SlidersHorizontal className="mx-auto size-4" aria-hidden="true" /></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-0"><EmptyState icon={Box} title="No data available" description="" className="min-h-[170px] rounded-none border-0 py-8" /></td></tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.description}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.assetNo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.assetType?.name ?? "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(item.acquisitionDate).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">—</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(item.acquisitionCostMinor)}</td>
                    <td className="px-4 py-3 text-body" />
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
