"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LoaderCircle, Plus, Search, SlidersHorizontal, UserCheck, UserX } from "lucide-react";
import Link from "next/link";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { RowActionsMenu } from "@/components/data/row-actions-menu";
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
import { listInterestRates, updateInterestRate, type InterestRate, type InterestRateStatus } from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function InterestRatesPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof listInterestRates>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | InterestRateStatus>("");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showStartDate, setShowStartDate] = useState(true);
  const [showEndDate, setShowEndDate] = useState(true);
  const [showType, setShowType] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);
  const { pushToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);

        void listInterestRates({ q: query, status })
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
              setError(message(failure, "Could not load interest rates."));
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

  const rates = data?.items ?? [];
  const hasFilters = Boolean(query.trim() || status);
  const columnCount = 2 + Number(showStartDate) + Number(showEndDate) + Number(showType);

  return (
    <div className="space-y-3">
      <ProductSetupHeader active="interest-rates" />
      {data?.canEdit ? (
        <div className="flex justify-end px-[13.44px] py-[6.72px]">
          <Button asChild variant="outline" className="h-[42px] border-primary px-4 text-primary hover:bg-primary-tint hover:text-primary">
            <Link href="/settings/products/interest-rates/new"><Plus className="size-4" aria-hidden="true" />Add new</Link>
          </Button>
        </div>
      ) : null}

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view interest rates. Ask an administrator for Settings Product : View." />
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
                <Input id="interest-rate-search" aria-label="Search interest rates" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-[42px] border-primary pl-10 text-primary placeholder:text-primary" />
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button type="button" variant="outline" className="h-[42px] min-w-[168px] justify-between border-primary px-3 text-primary hover:bg-primary-tint hover:text-primary"><span className="flex items-center gap-2"><Plus className="size-4" aria-hidden="true" />Add Filters</span><ChevronDown className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="start"><DropdownMenuCheckboxItem checked={showStatusFilter} onCheckedChange={setShowStatusFilter}>Status</DropdownMenuCheckboxItem></DropdownMenuContent>
              </DropdownMenu>
              {hasFilters ? <Button type="button" variant="ghost" onClick={() => { setQuery(""); setStatus(""); }} className="text-muted-foreground">Clear</Button> : null}
              {loading ? <LoaderCircle className="size-4 animate-spin text-primary" aria-label="Updating interest rates" /> : null}
            </div>
            {showStatusFilter ? <div className="border-b border-chrome px-[var(--space-12)] py-3"><select id="interest-rate-status" aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value as "" | InterestRateStatus)} className="h-[42px] min-w-[180px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div> : null}
            <table className="w-full min-w-[760px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold text-label">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  {showStartDate ? <th className="px-4 py-3">Start Date</th> : null}
                  {showEndDate ? <th className="px-4 py-3">End Date</th> : null}
                  {showType ? <th className="px-4 py-3">Type</th> : null}
                  <th className="w-14 px-2 py-2 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label="Table columns" className="text-primary"><SlidersHorizontal className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuCheckboxItem checked={showStartDate} onCheckedChange={setShowStartDate}>Start Date</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem checked={showEndDate} onCheckedChange={setShowEndDate}>End Date</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem checked={showType} onCheckedChange={setShowType}>Type</DropdownMenuCheckboxItem></DropdownMenuContent></DropdownMenu></th>
                </tr>
              </thead>
              <tbody className="text-body">
                {rates.length === 0 ? <tr><td colSpan={columnCount} className="h-[216px] px-4 text-center text-muted-foreground"><div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-subtle text-muted-foreground"><Search className="size-6" aria-hidden="true" /></div>{hasFilters ? "No interest rates match these filters." : "No data available"}</td></tr> : null}
                {rates.map((rate) => (
                  <tr key={rate.id} className="h-[52.27px] border-b border-card-border bg-white last:border-0">
                    <td className="px-4 py-3 font-medium">{rate.name}</td>
                    {showStartDate ? <td className="px-4 py-3">{rate.effectiveFrom ? new Date(rate.effectiveFrom).toLocaleDateString() : "N/A"}</td> : null}
                    {showEndDate ? <td className="px-4 py-3">N/A</td> : null}
                    {showType ? <td className="px-4 py-3">{rate.period}</td> : null}
                    <td className="w-14 bg-subtle/40 px-2 py-3">
                      <div className="flex justify-end">
                        <RowActionsMenu
                          label={`${rate.code} ${rate.name}`}
                          actions={
                            data?.canEdit
                              ? [
                                  {
                                    label: rate.status === "ACTIVE" ? "Deactivate" : "Activate",
                                    icon: rate.status === "ACTIVE" ? UserX : UserCheck,
                                    onSelect: async () => {
                                      const next = rate.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                                      await updateInterestRate(rate.id, { status: next });
                                      pushToast(`Interest rate ${next === "ACTIVE" ? "activated" : "deactivated"}.`);
                                      setReloadKey((value) => value + 1);
                                    },
                                  },
                                ]
                              : []
                          }
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
