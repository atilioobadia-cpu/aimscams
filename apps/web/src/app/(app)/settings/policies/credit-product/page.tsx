"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, Pencil, Plus, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { RowActionsMenu, type RowAction } from "@/components/data/row-actions-menu";
import { PolicySetupHeader } from "@/components/settings/policy-setup-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import {
  listCreditProductPolicies,
  type CreditProductPolicy,
  type CreditProductPolicyStatus,
} from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function CreditProductPoliciesPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof listCreditProductPolicies>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showLoanType, setShowLoanType] = useState(true);
  const [showRate, setShowRate] = useState(true);
  const [showAmount, setShowAmount] = useState(true);
  const [showTenure, setShowTenure] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);

        void listCreditProductPolicies({ q: query, status })
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
              setError(message(failure, "Could not load credit product policies."));
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

  const items = data?.items ?? [];
  const hasFilters = Boolean(query.trim() || status);
  const columnCount = 2 + Number(showLoanType) + Number(showRate) + Number(showAmount) + Number(showTenure) + Number(showStatus);

  return (
    <div className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
      <PolicySetupHeader active="credit-product" />
      {data?.canEdit ? (
        <div className="flex justify-end px-4 py-3">
          <Button asChild variant="outline" className="h-[38px] border-primary px-3 text-primary hover:bg-primary-tint hover:text-primary">
            <Link href="/settings/policies/credit-product/new"><Plus className="size-4" aria-hidden="true" />Add New</Link>
          </Button>
        </div>
      ) : null}

      <section className="overflow-hidden border-t border-card-border">
        <div className="flex min-h-[68px] flex-wrap items-center gap-3 border-b border-chrome px-3 py-3">
          <label className="relative block w-[240px] max-w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
            <Input id="credit-policy-search" aria-label="Search credit product policies" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-[42px] border-primary pl-10 text-primary placeholder:text-primary" />
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button type="button" variant="outline" className="h-[42px] min-w-[150px] justify-between border-primary px-3 text-primary hover:bg-primary-tint hover:text-primary"><span className="flex items-center gap-2"><Plus className="size-4" aria-hidden="true" />Add Filters</span><ChevronDown className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="start"><DropdownMenuCheckboxItem checked={showStatusFilter} onCheckedChange={setShowStatusFilter}>Status</DropdownMenuCheckboxItem></DropdownMenuContent>
          </DropdownMenu>
          {showStatusFilter ? <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-[42px] min-w-[180px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text"><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select> : null}
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label="Table columns" className="text-primary"><SlidersHorizontal className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem checked={showLoanType} onCheckedChange={setShowLoanType}>Loan Type</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showRate} onCheckedChange={setShowRate}>Interest Rate</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showAmount} onCheckedChange={setShowAmount}>Loan Amount</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showTenure} onCheckedChange={setShowTenure}>Tenure</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showStatus} onCheckedChange={setShowStatus}>Status</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {forbidden ? (
          <ForbiddenPanel message="Your role cannot view credit product policies. Ask an administrator for Settings Policy : View." />
        ) : error ? (
          <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
        ) : loading ? (
          <PanelSkeleton rows={8} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold text-label">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  {showLoanType ? <th className="px-4 py-3">Loan Type</th> : null}
                  {showRate ? <th className="px-4 py-3">Interest Rate</th> : null}
                  {showAmount ? <th className="px-4 py-3">Loan Amount</th> : null}
                  {showTenure ? <th className="px-4 py-3">Tenure</th> : null}
                  {showStatus ? <th className="px-4 py-3">Status</th> : null}
                  <th className="w-14 px-2 py-2 text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="text-body">
                {items.length === 0 ? <tr><td colSpan={columnCount} className="h-[216px] px-4 text-center text-muted-foreground"><div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-subtle text-muted-foreground"><Search className="size-6" aria-hidden="true" /></div>{hasFilters ? "No credit product policies match these filters." : "No data available"}</td></tr> : null}
                {items.map((item) => {
                  const actions: RowAction[] = [
                    { label: "View policy", icon: Eye, href: `/settings/policies/credit-product/${item.id}` },
                    ...(data?.canEdit ? [{ label: "Edit policy", icon: Pencil, href: `/settings/policies/credit-product/${item.id}/edit` }] : []),
                  ];
                  return (
                    <tr key={item.id} className="h-[67px] border-b border-card-border last:border-0">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      {showLoanType ? <td className="px-4 py-3">—</td> : null}
                      {showRate ? <td className="px-4 py-3">—</td> : null}
                      {showAmount ? <td className="px-4 py-3">—</td> : null}
                      {showTenure ? <td className="px-4 py-3">—</td> : null}
                      {showStatus ? <td className="px-4 py-3"><Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{titleCase(item.status)}</Badge></td> : null}
                      <td className="w-14 bg-subtle/40 px-2 py-3"><div className="flex justify-end"><RowActionsMenu label={`${item.code} ${item.name}`} actions={actions} /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
