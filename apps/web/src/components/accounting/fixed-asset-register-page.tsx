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
import { createFixedAsset, listAssetTypes, listFixedAssets, type AssetType, type FixedAsset } from "@/lib/accounting";
import { formatTzs } from "@/lib/format";
import { titleCase } from "@/lib/privacy";

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
  const [assetNo, setAssetNo] = useState("");
  const [description, setDescription] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().slice(0, 10));
  const [cost, setCost] = useState("");
  const [assetTypeId, setAssetTypeId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setCreateError(failureMessage(failure));
    } finally {
      setCreating(false);
    }
  }

  const filtered = assets.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return item.assetNo.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
  });

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Fixed asset register" description="Acquisition, valuation, depreciation and disposal." />
        <ForbiddenPanel message="Your role cannot view fixed assets. Ask an administrator for Settings Accounting : View." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Fixed asset register" description="Acquisition, valuation, depreciation and disposal of fixed assets." breadcrumb="Accounting" />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <h2 className="mb-3 fs-text font-bold text-strong">Register a fixed asset</h2>
        <form className="space-y-3" onSubmit={handleCreate}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-no">Asset number</label>
              <Input id="asset-no" value={assetNo} onChange={(event) => setAssetNo(event.target.value)} placeholder="FA-0001" className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-desc">Description</label>
              <Input id="asset-desc" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-date">Acquisition date</label>
              <Input id="asset-date" type="date" value={acquisitionDate} onChange={(event) => setAcquisitionDate(event.target.value)} className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-cost">Acquisition cost (minor units)</label>
              <Input id="asset-cost" value={cost} onChange={(event) => setCost(event.target.value)} placeholder="0" className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-type">Asset type</label>
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
      </section>

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="asset-search">Search</label>
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="asset-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Asset number or description" className="h-[var(--control-height)] pl-9" />
            </div>
          </div>
        </div>
        {loading ? (
          <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
            <PanelSkeleton rows={6} />
          </section>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Box} title={query ? "No assets match" : "No fixed assets yet"} description={query ? "Adjust the search." : "Register a fixed asset to start the register."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Asset number</th>
                  <th className="whitespace-nowrap px-4 py-3">Description</th>
                  <th className="whitespace-nowrap px-4 py-3">Type</th>
                  <th className="whitespace-nowrap px-4 py-3">Acquisition date</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Cost</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Accumulated depreciation</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.assetNo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.description}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.assetType?.name ?? "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(item.acquisitionDate).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(item.acquisitionCostMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(item.accumulatedDepreciationMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{titleCase(item.status)}</Badge></td>
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
