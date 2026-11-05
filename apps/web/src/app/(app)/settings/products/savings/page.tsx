"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, LoaderCircle, Pencil, Plus, Search, SlidersHorizontal, UserCheck, UserX } from "lucide-react";
import Link from "next/link";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { RowActionsMenu, type RowAction } from "@/components/data/row-actions-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ProductSetupHeader } from "@/components/settings/product-setup-header";
import { ApiError } from "@/lib/api";
import {
  listSavingsProducts,
  updateSavingsProduct,
  type SavingsProduct,
  type SavingsProductStatus,
} from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function SavingsProductsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof listSavingsProducts>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | SavingsProductStatus>("");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showType, setShowType] = useState(true);
  const [showAccountNumber, setShowAccountNumber] = useState(true);
  const [showLedgerCode, setShowLedgerCode] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);
  const { pushToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);

        void listSavingsProducts({ q: query, status })
          .then((next) => {
            if (cancelled) return;
            setData(next);
            setForbidden(false);
          })
          .catch((failure: unknown) => {
            if (cancelled) return;
            if (failure instanceof ApiError && failure.status === 403) {
              setForbidden(true);
              setData(null);
            } else {
              setError(message(failure, "Could not load savings products."));
            }
          })
          .finally(() => {
            if (cancelled) return;
            firstLoad.current = false;
            setLoading(false);
          });
      },
      firstLoad.current ? 0 : 250,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, status, reloadKey]);

  const products = data?.items ?? [];
  const hasFilters = Boolean(query.trim() || status);
  const columnCount = 2 + Number(showType) + Number(showAccountNumber) + Number(showLedgerCode) + Number(showDescription);

  function formatMinorAmount(value: string): string {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "N/A";
    return (amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div className="space-y-3">
      <ProductSetupHeader active="savings" />
      {data?.canEdit ? (
        <div className="flex justify-end px-[13.44px] py-[6.72px]">
          <Button asChild variant="outline" className="h-[28.77px] rounded-[6px] border-primary bg-transparent px-[8.4px] py-[6.72px] !text-[11.76px] text-center text-primary hover:bg-primary-tint hover:text-primary">
            <Link href="/settings/products/savings/new"><Plus className="size-4" aria-hidden="true" />Add new</Link>
          </Button>
        </div>
      ) : null}

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view savings products. Ask an administrator for Settings Product : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <div className="flex min-h-[56px] flex-wrap items-center gap-4 border-b border-chrome px-[13.44px] py-[6.72px]">
              <label className="relative block w-[240px] max-w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
                <Input id="savings-product-search" aria-label="Search savings products" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-[42px] border-primary pl-10 text-primary placeholder:text-primary" />
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="h-[42px] min-w-[168px] justify-between border-primary px-3 text-primary hover:bg-primary-tint hover:text-primary">
                    <span className="flex items-center gap-2"><Plus className="size-4" aria-hidden="true" />Add Filters</span>
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start"><DropdownMenuCheckboxItem checked={showStatusFilter} onCheckedChange={setShowStatusFilter}>Status</DropdownMenuCheckboxItem></DropdownMenuContent>
              </DropdownMenu>
              {hasFilters ? <Button type="button" variant="ghost" onClick={() => { setQuery(""); setStatus(""); }} className="text-muted-foreground">Clear</Button> : null}
              {loading ? <LoaderCircle className="size-4 animate-spin text-primary" aria-label="Updating savings products" /> : null}
            </div>
            {showStatusFilter ? (
              <div className="border-b border-chrome px-[var(--space-12)] py-3">
                <select id="savings-product-status" aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value as "" | SavingsProductStatus)} className="h-[42px] min-w-[180px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body">
                  <option value="">All statuses</option><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                </select>
              </div>
            ) : null}
            <table className="w-full min-w-[900px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold text-label">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  {showType ? <th className="px-4 py-3">Type</th> : null}
                  {showAccountNumber ? <th className="px-4 py-3">Account Number</th> : null}
                  {showLedgerCode ? <th className="px-4 py-3">General Ledger Code</th> : null}
                  {showDescription ? <th className="px-4 py-3">Description</th> : null}
                  <th className="w-14 px-2 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label="Table columns" className="text-primary"><SlidersHorizontal className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuCheckboxItem checked={showType} onCheckedChange={setShowType}>Type</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={showAccountNumber} onCheckedChange={setShowAccountNumber}>Account Number</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={showLedgerCode} onCheckedChange={setShowLedgerCode}>General Ledger Code</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={showDescription} onCheckedChange={setShowDescription}>Description</DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </th>
                </tr>
              </thead>
              <tbody className="text-body">
                {products.length === 0 ? <tr><td colSpan={columnCount} className="h-[100px] px-4 text-center text-muted-foreground">{hasFilters ? "No savings products match these filters." : "No savings products are configured for this organization."}</td></tr> : null}
                {products.map((product) => {
                  const actions: RowAction[] = data?.canEdit
                    ? [
                        {
                          label: "Edit product",
                          icon: Pencil,
                          href: `/settings/products/savings/${product.id}`,
                        },
                        {
                          label: product.status === "ACTIVE" ? "Deactivate product" : "Activate product",
                          icon: product.status === "ACTIVE" ? UserX : UserCheck,
                          onSelect: async () => {
                            const next = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                            await updateSavingsProduct(product.id, { status: next });
                            pushToast(`Savings product ${next === "ACTIVE" ? "activated" : "deactivated"}.`);
                            setReloadKey((value) => value + 1);
                          },
                        },
                      ]
                    : [];
                  return (
                    <tr key={product.id} className="h-[52.27px] border-b border-card-border bg-white last:border-0">
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      {showType ? <td className="px-4 py-3">Savings</td> : null}
                      {showAccountNumber ? <td className="px-4 py-3">N/A</td> : null}
                      {showLedgerCode ? <td className="px-4 py-3">N/A</td> : null}
                      {showDescription ? <td className="px-4 py-3">{product.description || "N/A"}</td> : null}
                      <td className="w-14 bg-subtle/40 px-2 py-3">
                        <div className="flex justify-end">
                          <RowActionsMenu label={`${product.code} ${product.name}`} actions={actions} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
