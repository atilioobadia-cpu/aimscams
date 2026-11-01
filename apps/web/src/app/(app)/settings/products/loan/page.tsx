"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, LoaderCircle, Plus, Search, SlidersHorizontal, UserCheck, UserX } from "lucide-react";
import Link from "next/link";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { RowActionsMenu } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
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
  listLoanProducts,
  updateLoanProduct,
  type LoanProduct,
  type LoanProductStatus,
} from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function LoanProductsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof listLoanProducts>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | LoanProductStatus>("");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showInterestRate, setShowInterestRate] = useState(true);
  const [showLoanAmount, setShowLoanAmount] = useState(true);
  const [showTenure, setShowTenure] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);
  const { pushToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        else setLoading(false);
        setError(null);

        void listLoanProducts({ q: query, status })
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
              setError(message(failure, "Could not load loan products."));
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
  const columnCount = 2 + Number(showInterestRate) + Number(showLoanAmount) + Number(showTenure) + Number(showStatus);

  function formatMinorAmount(value: string): string {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "N/A";
    return (amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div className="space-y-3">
      <ProductSetupHeader active="loan" />

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view loan products. Ask an administrator for Settings Product : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <div className="flex min-h-[71px] flex-wrap items-center gap-4 border-b border-chrome px-[var(--space-12)] py-3">
              <label className="relative block w-[240px] max-w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
                <Input id="loan-product-search" aria-label="Search loan products" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-[42px] border-primary pl-10 text-primary placeholder:text-primary" />
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
                </DropdownMenuContent>
              </DropdownMenu>
              {hasFilters ? <Button type="button" variant="ghost" onClick={() => { setQuery(""); setStatus(""); }} className="text-muted-foreground">Clear</Button> : null}
              {loading ? <LoaderCircle className="size-4 animate-spin text-primary" aria-label="Updating loan products" /> : null}
            </div>
            {showStatusFilter ? (
              <div className="border-b border-chrome px-[var(--space-12)] py-3">
                <select id="loan-product-status" aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value as "" | LoanProductStatus)} className="h-[42px] min-w-[180px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body">
                  <option value="">All statuses</option><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                </select>
              </div>
            ) : null}
            <table className="w-full min-w-[900px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold text-label">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  {showInterestRate ? <th className="px-4 py-3">Interest Rate</th> : null}
                  {showLoanAmount ? <th className="px-4 py-3">Loan Amount</th> : null}
                  {showTenure ? <th className="px-4 py-3">Tenure</th> : null}
                  {showStatus ? <th className="px-4 py-3">Status</th> : null}
                  <th className="w-14 px-2 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label="Table columns" className="text-primary"><SlidersHorizontal className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuCheckboxItem checked={showInterestRate} onCheckedChange={setShowInterestRate}>Interest Rate</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={showLoanAmount} onCheckedChange={setShowLoanAmount}>Loan Amount</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={showTenure} onCheckedChange={setShowTenure}>Tenure</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={showStatus} onCheckedChange={setShowStatus}>Status</DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </th>
                </tr>
              </thead>
              <tbody className="text-body">
                {products.length === 0 ? (
                  <tr><td colSpan={columnCount} className="h-[100px] px-4 text-center text-muted-foreground">{hasFilters ? "No loan products match these filters." : "No loan products are configured for this organization."}</td></tr>
                ) : null}
                {products.map((product) => (
                  <tr key={product.id} className="h-[67px] border-b border-card-border last:border-0">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    {showInterestRate ? <td className="px-4 py-3 tabular-nums">{(product.interestRateBp / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%</td> : null}
                    {showLoanAmount ? <td className="px-4 py-3 tabular-nums">{formatMinorAmount(product.minPrincipalMinor)} to {formatMinorAmount(product.maxPrincipalMinor)}</td> : null}
                    {showTenure ? <td className="px-4 py-3 tabular-nums">Months {product.minTenureMonths} to {product.maxTenureMonths}</td> : null}
                    {showStatus ? <td className="px-4 py-3"><Badge variant={product.status === "ACTIVE" ? "default" : "outline"}>{titleCase(product.status)}</Badge></td> : null}
                    <td className="w-14 bg-subtle/40 px-2 py-3">
                      <div className="flex justify-end">
                        <RowActionsMenu
                          label={`${product.code} ${product.name}`}
                          actions={[
                            {
                              label: "View product",
                              icon: Eye,
                              href: `/settings/products/loan/${product.id}`,
                            },
                            ...(data?.canEdit
                              ? [
                                  {
                                    label: product.status === "ACTIVE" ? "Deactivate product" : "Activate product",
                                    icon: product.status === "ACTIVE" ? UserX : UserCheck,
                                    onSelect: async () => {
                                      const next = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                                      await updateLoanProduct(product.id, { status: next });
                                      pushToast(`Loan product ${next === "ACTIVE" ? "activated" : "deactivated"}.`);
                                      setReloadKey((value) => value + 1);
                                    },
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
