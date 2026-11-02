"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilterX,
  FileText,
  Plus,
  Save,
  Search,
} from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api";
import { formatMinorUnitsExact } from "@/lib/format";
import { listLoanOfficers, listLoans, type Loan, type LoanOfficer } from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function initials(value: string | null | undefined): string {
  const parts = String(value ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

const statusGroups = {
  Active: ["ACTIVE", "DISBURSED", "DELINQUENT", "NPA", "RESCHEDULED", "WRITTEN_OFF"],
  New: ["DRAFT", "SUBMITTED", "IN_REVIEW", "APPROVED"],
  Closed: ["CLOSED", "REJECTED"],
} as const;

type LoanTab = keyof typeof statusGroups;
type ExtraFilter = "product" | "tenure";

const extraFilterOptions: Array<{ key: ExtraFilter; label: string }> = [
  { key: "product", label: "Product" },
  { key: "tenure", label: "Tenure period" },
];

export default function LoansPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof listLoans>> | null>(null);
  const [officers, setOfficers] = useState<LoanOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<LoanTab>("Active");
  const [officerId, setOfficerId] = useState("");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [extraFilterFields, setExtraFilterFields] = useState<ExtraFilter[]>([]);
  const [extraFilters, setExtraFilters] = useState<Record<ExtraFilter, string>>({ product: "", tenure: "" });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);
        void listLoans({ q: query })
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
              setError(message(failure, "Could not load loans."));
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
  }, [query, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    void listLoanOfficers()
      .then((response) => {
        if (!cancelled) setOfficers(response.items);
      })
      .catch(() => {
        if (!cancelled) setOfficers([]);
      });
    return () => { cancelled = true; };
  }, []);

  const items = useMemo(() => data?.items ?? [], [data]);
  const visibleItems = useMemo(() => items.filter((item) => {
    if (!(statusGroups[tab] as readonly string[]).includes(item.status)) return false;
    if (officerId && item.loanOfficerId !== officerId) return false;
    return extraFilterFields.every((key) => {
      const value = extraFilters[key].trim().toLocaleLowerCase();
      if (!value) return true;
      const fieldValue = key === "product"
        ? `${item.productName ?? ""} ${item.productCode ?? ""}`
        : titleCase(item.tenurePeriod.toLocaleLowerCase());
      return fieldValue.toLocaleLowerCase().includes(value);
    });
  }), [items, tab, officerId, extraFilterFields, extraFilters]);

  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstItem = visibleItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, visibleItems.length);
  const hasFilters = Boolean(query.trim() || officerId || Object.values(extraFilters).some((value) => value.trim()));

  function clearFilters() {
    setQuery("");
    setTab("Active");
    setOfficerId("");
    setExtraFilterFields([]);
    setExtraFilters({ product: "", tenure: "" });
    setFilterMenuOpen(false);
    setPage(1);
  }

  return (
    <div className="space-y-[18px] text-[13.44px] text-[#495057]">
      <header className="flex min-h-[84px] flex-col gap-4 rounded-[var(--card-radius)] border border-card-border bg-surface px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Banknote className="size-6 shrink-0 text-primary" aria-hidden="true" />
          <h2 className="text-[20.16px] font-semibold leading-tight text-[#495057]">Loans</h2>
        </div>
      </header>

      <div role="tablist" aria-label="Loan status" className="flex h-[45px] items-stretch bg-surface px-0">
        {(Object.keys(statusGroups) as LoanTab[]).map((label) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={tab === label}
            aria-controls="loan-list-panel"
            id={`loan-tab-${label.toLocaleLowerCase()}`}
            data-loan-tab={label}
            tabIndex={tab === label ? 0 : -1}
            className={`min-w-[80px] px-[13.44px] py-[16.8px] text-[13.33px] font-medium transition-colors ${tab === label ? "bg-white font-semibold text-primary" : "bg-[#f8fafc] font-medium text-[#6c757d]"}`}
            onClick={() => { setTab(label); setPage(1); }}
            onKeyDown={(event) => {
              const labels = Object.keys(statusGroups) as LoanTab[];
              const index = labels.indexOf(label);
              const nextIndex = event.key === "ArrowRight" ? (index + 1) % labels.length
                : event.key === "ArrowLeft" ? (index - 1 + labels.length) % labels.length
                : event.key === "Home" ? 0
                : event.key === "End" ? labels.length - 1
                : -1;
              if (nextIndex < 0) return;
              event.preventDefault();
              const nextTab = labels[nextIndex];
              setTab(nextTab);
              setPage(1);
              event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-loan-tab="${nextTab}"]`)?.focus();
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <section
        id="loan-list-panel"
        role="tabpanel"
        aria-labelledby={`loan-tab-${tab.toLocaleLowerCase()}`}
        tabIndex={0}
        className="mt-[8px] overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface"
      >
        <div className="min-h-[56px] rounded-[6px] border border-[#dee2e6] bg-surface px-[10.08px] py-[10.08px]">
          <div className="flex flex-wrap items-center gap-[6.72px]">
            <div className="relative w-[191px] shrink-0">
              <Search className="pointer-events-none absolute left-[10px] top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="loan-search"
                aria-label="Search loans"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                placeholder="Search"
                className="h-[34px] w-[191px] rounded-[6px] border border-primary bg-background pl-[33.6px] pr-[10.08px] py-[8.4px] text-[13.44px] text-[#495057] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
            <div className="relative w-[106px] shrink-0">
              <label className="sr-only" htmlFor="loan-officer">Loan officer</label>
              <select
                id="loan-officer"
                aria-label="Loan officer"
                value={officerId}
                onChange={(event) => { setOfficerId(event.target.value); setPage(1); }}
                className="h-[35px] w-[106px] rounded-[6px] border border-transparent bg-transparent px-2 text-[11.76px] font-medium text-primary outline-none"
              >
                <option value="">Loan officer</option>
                {officers.map((officer) => <option key={officer.id} value={officer.id}>{officer.fullName}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
            </div>
            <div className="relative w-[131.33px] shrink-0">
              <Button
                type="button"
                variant="outline"
                aria-expanded={filterMenuOpen}
                aria-controls="loan-extra-filters"
                className="h-[35px] w-[131.33px] justify-between gap-1 rounded-[6px] !border-primary !text-primary"
                onClick={() => setFilterMenuOpen((open) => !open)}
              >
                <span className="inline-flex items-center gap-2"><Plus aria-hidden="true" />Add Filters</span>
                <ChevronDown aria-hidden="true" />
              </Button>
              {filterMenuOpen ? (
                <div id="loan-extra-filters" role="group" aria-label="Additional loan filters" className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-card-border bg-surface p-2 shadow-lg">
                  {extraFilterOptions.map(({ key, label }) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-[13.44px] hover:bg-subtle">
                      <input
                        type="checkbox"
                        checked={extraFilterFields.includes(key)}
                        onChange={(event) => {
                          setExtraFilterFields((current) => event.target.checked ? [...current, key] : current.filter((field) => field !== key));
                          setPage(1);
                          if (!event.target.checked) setExtraFilters((current) => ({ ...current, [key]: "" }));
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
            <Button type="button" variant="outline" size="icon" aria-label="Save current filters" title="Save current filters" className="h-[27px] w-[30px] rounded-[6px] !border-primary !text-primary">
              <Save aria-hidden="true" className="size-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" aria-label="Clear filters" title="Clear filters" className="h-[27px] w-[30px] rounded-[6px] !border-primary !text-primary" onClick={clearFilters}>
              <FilterX aria-hidden="true" className="size-4" />
            </Button>
          </div>
        {extraFilterFields.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {extraFilterOptions.filter(({ key }) => extraFilterFields.includes(key)).map(({ key, label }) => (
                <Input
                  key={key}
                  aria-label={label}
                  placeholder={label}
                  value={extraFilters[key]}
                  onChange={(event) => { setExtraFilters((current) => ({ ...current, [key]: event.target.value })); setPage(1); }}
                  className="h-[var(--control-height)] w-full sm:w-[230px]"
                />
              ))}
            </div>
          ) : null}
        </div>

        {forbidden ? (
          <ForbiddenPanel message="Your role cannot view loans. Ask an administrator for Loan Account : View." />
        ) : error ? (
          <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
        ) : loading ? (
          <PanelSkeleton rows={8} />
        ) : (
          <>
            <div className="table-scroll overflow-x-auto">
              <table className="w-full min-w-[1548px] text-left text-[13.44px]">
                <thead className="border-b border-card-border bg-[#f8fafc] text-[13.44px] font-bold tracking-wide text-[#495057]">
                  <tr className="h-[37px]">
                    <th className="px-[13.44px] py-[10.08px]">Account number</th>
                    <th className="px-[13.44px] py-[10.08px]">Member name</th>
                    <th className="px-[13.44px] py-[10.08px]">Product</th>
                    <th className="px-[13.44px] py-[10.08px]">Loan officer</th>
                    <th className="px-[13.44px] py-[10.08px]">Status</th>
                    <th className="px-[13.44px] py-[10.08px]">Tenure</th>
                    <th className="px-[13.44px] py-[10.08px] text-right">Loan amount (TSh)</th>
                    <th className="px-[13.44px] py-[10.08px] text-right">Balance (TSh)</th>
                    <th className="px-[13.44px] py-[10.08px]">Created date</th>
                    <th className="px-[13.44px] py-[10.08px] text-right">Overdue days</th>
                    <th className="px-[13.44px] py-[10.08px]">Provisioning status</th>
                    <th className="px-[13.44px] py-[10.08px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item: Loan) => (
                    <tr key={item.id} className="border-b border-card-border last:border-0">
                      <td className="whitespace-nowrap px-[13.44px] py-[10.08px] font-medium text-[#495057]">{item.loanNumber}</td>
                      <td className="whitespace-nowrap px-[13.44px] py-[10.08px] text-[#495057]"><span className="inline-flex items-center gap-2"><span className="flex size-[24px] items-center justify-center rounded-full bg-primary-tint text-[11.76px] font-semibold text-primary">{initials(item.clientName)}</span>{item.clientName ?? "N/A"}</span></td>
                      <td className="whitespace-nowrap px-[13.44px] py-[10.08px] text-[#495057]">{item.productName ?? item.productCode ?? "N/A"}</td>
                      <td className="whitespace-nowrap px-[13.44px] py-[10.08px] text-[#495057]"><span className="inline-flex items-center gap-2"><span className="flex size-[24px] items-center justify-center rounded-full bg-primary-tint text-[11.76px] font-semibold text-primary">{initials(item.loanOfficerName)}</span>{item.loanOfficerName ?? "N/A"}</span></td>
                      <td className="whitespace-nowrap px-4 py-6"><Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{titleCase(item.status)}</Badge></td>
                      <td className="whitespace-nowrap px-[13.44px] py-[10.08px] text-[#495057]">{item.tenureCount} {titleCase(item.tenurePeriod.toLocaleLowerCase())}</td>
                      <td className="whitespace-nowrap px-[13.44px] py-[10.08px] text-right tabular-nums text-[#495057]">{formatMinorUnitsExact(item.principalMinor)}</td>
                      <td className="whitespace-nowrap px-[13.44px] py-[10.08px] text-right"><button type="button" className="inline-flex items-center gap-1 rounded-[6px] border border-primary px-2 py-1 text-[11.76px] font-medium text-primary hover:bg-primary-tint"><Eye className="size-4" aria-hidden="true" />View Balance</button></td>
                      <td className="whitespace-nowrap px-[13.44px] py-[10.08px] text-[#495057]">{new Date(item.createdAt).toLocaleDateString("en-GB").replaceAll("/", "-")}</td>
                      <td className="whitespace-nowrap px-[13.44px] py-[10.08px] text-right tabular-nums text-[#495057]">{item.daysPastDue}</td>
                      <td className="whitespace-nowrap px-[13.44px] py-[10.08px] text-[#495057]">N/A</td>
                      <td className="px-4 py-6">
                        <div className="flex justify-end">
                          <RowActionsMenu label={item.loanNumber} actions={[{ label: "View details", icon: Eye, href: `/account-loan-details/${item.id}` }]} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visibleItems.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-[13.44px] py-[10.08px] text-center">
                        <p className="fs-text font-semibold text-[#495057]">{hasFilters ? "No loan matches" : `No ${tab.toLocaleLowerCase()} loans`}</p>
                        <p className="mt-1 fs-text text-muted-foreground">{hasFilters ? "Adjust or clear the filters to see other loans." : "Loans in this status group will appear here."}</p>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-card-border px-3 py-2 fs-text text-muted-foreground">
              <span aria-live="polite">Showing {firstItem} to {lastItem} of {visibleItems.length} entries</span>
              <nav aria-label="Loan list pages" className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon-xs" aria-label="First page" disabled={currentPage === 1} onClick={() => setPage(1)}><ChevronsLeft aria-hidden="true" /></Button>
                <Button type="button" variant="ghost" size="icon-xs" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft aria-hidden="true" /></Button>
                <span aria-current="page" className="grid size-10 place-items-center rounded-full bg-primary-tint text-primary">{currentPage}</span>
                <Button type="button" variant="ghost" size="icon-xs" aria-label="Next page" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><ChevronRight aria-hidden="true" /></Button>
                <Button type="button" variant="ghost" size="icon-xs" aria-label="Last page" disabled={currentPage >= pageCount} onClick={() => setPage(pageCount)}><ChevronsRight aria-hidden="true" /></Button>
              </nav>
              <label className="sr-only" htmlFor="loan-page-size">Rows per page</label>
              <div className="w-[80px] shrink-0"><select id="loan-page-size" aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </select></div>
            </div>
          </>
        )}
      </section>

      <Modal open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} title="Save current filters" footer={<Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Close</Button>}>
        <p className="fs-text text-[#495057]">Saved filters are not available for this installation yet.</p>
      </Modal>
    </div>
  );
}
