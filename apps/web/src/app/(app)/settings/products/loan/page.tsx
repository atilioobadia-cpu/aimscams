"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronDown, Eye, LoaderCircle, Plus, Search, SlidersHorizontal, UserCheck, UserX } from "lucide-react";

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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { ProductSetupHeader } from "@/components/settings/product-setup-header";
import { ApiError } from "@/lib/api";
import {
  createLoanProduct,
  listLoanProducts,
  updateLoanProduct,
  type LoanProductStatus,
} from "@/lib/settings";
import { parseMajorToMinor } from "@/lib/accounting";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

type LoanProductDraft = {
  code: string;
  name: string;
  interestRate: string;
  minPrincipal: string;
  maxPrincipal: string;
  tenurePeriod: "WEEKS" | "MONTHS";
  minTenure: string;
  maxTenure: string;
};

const EMPTY_PRODUCT_DRAFT: LoanProductDraft = {
  code: "",
  name: "",
  interestRate: "3.5",
  minPrincipal: "",
  maxPrincipal: "",
  tenurePeriod: "MONTHS",
  minTenure: "1",
  maxTenure: "24",
};

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
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [draft, setDraft] = useState<LoanProductDraft>(EMPTY_PRODUCT_DRAFT);
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

  async function submitNewProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minPrincipalMinor = parseMajorToMinor(draft.minPrincipal);
    const maxPrincipalMinor = parseMajorToMinor(draft.maxPrincipal);
    const interestPercent = Number(draft.interestRate);
    const minTenure = Number(draft.minTenure);
    const maxTenure = Number(draft.maxTenure);
    if (minPrincipalMinor === null || maxPrincipalMinor === null || minPrincipalMinor <= 0n || maxPrincipalMinor < minPrincipalMinor) {
      setCreateError("Enter valid loan amount bounds, with the maximum at least equal to the minimum.");
      return;
    }
    if (!Number.isFinite(interestPercent) || interestPercent < 0 || !Number.isInteger(minTenure) || !Number.isInteger(maxTenure) || minTenure < 1 || maxTenure < minTenure) {
      setCreateError("Enter a valid interest rate and tenure range.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await createLoanProduct({
        code: draft.code,
        name: draft.name,
        status: "ACTIVE",
        minPrincipalMinor: minPrincipalMinor.toString(),
        maxPrincipalMinor: maxPrincipalMinor.toString(),
        tenurePeriod: draft.tenurePeriod,
        minTenureCount: minTenure,
        maxTenureCount: maxTenure,
        interestRateBp: Math.round(interestPercent * 100),
        interestMethod: "REDUCING_BALANCE_EQUAL_INSTALLMENT",
      });
      setCreateOpen(false);
      setDraft(EMPTY_PRODUCT_DRAFT);
      pushToast("Loan product created.");
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setCreateError(message(failure, "Could not create this loan product."));
    } finally {
      setCreating(false);
    }
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
            <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-4 border-b border-chrome px-[13.44px] py-[6.72px]">
              <div className="flex flex-wrap items-center gap-4">
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
              {data?.canCreate ? <Button type="button" onClick={() => { setCreateError(null); setCreateOpen(true); }} className="h-[38px]"><Plus className="size-4" aria-hidden="true" />Add Loan Product</Button> : null}
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
                  <tr key={product.id} className="h-[52.27px] border-b border-card-border bg-white last:border-0">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    {showInterestRate ? <td className="px-4 py-3 tabular-nums">{(product.interestRateBp / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%</td> : null}
                    {showLoanAmount ? <td className="px-4 py-3 tabular-nums">{formatMinorAmount(product.minPrincipalMinor)} to {formatMinorAmount(product.maxPrincipalMinor)}</td> : null}
                    {showTenure ? <td className="px-4 py-3 tabular-nums">{product.tenurePeriod === "WEEKS" ? "Weeks" : product.tenurePeriod === "DAYS" ? "Days" : "Months"} {product.minTenureCount} to {product.maxTenureCount}</td> : null}
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
      <Dialog open={createOpen} onOpenChange={(open) => { if (!creating) setCreateOpen(open); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={(event) => void submitNewProduct(event)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add Loan Product</DialogTitle>
              <DialogDescription>Configure an active product for loan applications.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1"><span className="block fs-text font-medium">Product code *</span><Input required maxLength={32} value={draft.code} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") }))} placeholder="e.g. STAFF_LOAN" /></label>
              <label className="space-y-1"><span className="block fs-text font-medium">Product name *</span><Input required maxLength={120} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value.toUpperCase() }))} placeholder="e.g. STAFF LOAN" /></label>
              <label className="space-y-1"><span className="block fs-text font-medium">Interest rate (% per month) *</span><Input required type="number" min="0" step="0.01" value={draft.interestRate} onChange={(event) => setDraft((current) => ({ ...current, interestRate: event.target.value }))} /></label>
              <label className="space-y-1"><span className="block fs-text font-medium">Minimum loan amount (TSh) *</span><Input required type="number" min="0.01" step="0.01" value={draft.minPrincipal} onChange={(event) => setDraft((current) => ({ ...current, minPrincipal: event.target.value }))} /></label>
              <label className="space-y-1"><span className="block fs-text font-medium">Maximum loan amount (TSh) *</span><Input required type="number" min="0.01" step="0.01" value={draft.maxPrincipal} onChange={(event) => setDraft((current) => ({ ...current, maxPrincipal: event.target.value }))} /></label>
              <label className="space-y-1"><span className="block fs-text font-medium">Tenure period *</span><select required value={draft.tenurePeriod} onChange={(event) => setDraft((current) => ({ ...current, tenurePeriod: event.target.value as LoanProductDraft["tenurePeriod"] }))} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text"><option value="MONTHS">Months</option><option value="WEEKS">Weeks</option></select></label>
              <label className="space-y-1"><span className="block fs-text font-medium">Minimum tenure *</span><Input required type="number" min="1" max="600" step="1" value={draft.minTenure} onChange={(event) => setDraft((current) => ({ ...current, minTenure: event.target.value }))} /></label>
              <label className="space-y-1"><span className="block fs-text font-medium">Maximum tenure *</span><Input required type="number" min="1" max="600" step="1" value={draft.maxTenure} onChange={(event) => setDraft((current) => ({ ...current, maxTenure: event.target.value }))} /></label>
            </div>
            {createError ? <p role="alert" className="fs-text text-destructive">{createError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={creating} onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating ? "Saving…" : "Save Product"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
