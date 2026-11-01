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
  const [tab, setTab] = useState<LoanTab>("Closed");
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
    setTab("Closed");
    setOfficerId("");
    setExtraFilterFields([]);
    setExtraFilters({ product: "", tenure: "" });
    setFilterMenuOpen(false);
    setPage(1);
  }

  return (
    <div className="space-y-[18px]">
      <PageHeader
        variant="card"
        icon={<Banknote className="size-6 shrink-0 text-primary" aria-hidden="true" />}
        title="Loans"
      />

      <div role="tablist" aria-label="Loan status" className="flex h-[55px] items-stretch border-b border-card-border bg-surface px-2">
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
            className={`min-w-[80px] border-b-2 px-4 fs-text font-medium transition-colors hover:bg-subtle ${tab === label ? "border-primary text-primary" : "border-transparent text-body"}`}
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
        className="mx-5 !mt-[15px] overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface"
      >
        <div className="border-b border-card-border p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[240px] sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="loan-search"
                aria-label="Search loans"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                placeholder="Search"
                className="h-[var(--control-height)] !border-primary pl-9"
              />
            </div>
            <div className="relative w-full sm:w-[135px]">
              <label className="sr-only" htmlFor="loan-officer">Loan officer</label>
              <select
                id="loan-officer"
                aria-label="Loan officer"
                value={officerId}
                onChange={(event) => { setOfficerId(event.target.value); setPage(1); }}
                className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] !border-primary bg-background px-3 fs-text"
              >
                <option value="">Loan officer</option>
                {officers.map((officer) => <option key={officer.id} value={officer.id}>{officer.fullName}</option>)}
              </select>
            </div>
            <div className="relative w-full sm:w-[166px]">
              <Button
                type="button"
                variant="outline"
                aria-expanded={filterMenuOpen}
                aria-controls="loan-extra-filters"
                className="w-full justify-between !border-primary !text-primary"
                onClick={() => setFilterMenuOpen((open) => !open)}
              >
                <span className="inline-flex items-center gap-2"><Plus aria-hidden="true" />Add filters</span>
                <ChevronDown aria-hidden="true" />
              </Button>
              {filterMenuOpen ? (
                <div id="loan-extra-filters" role="group" aria-label="Additional loan filters" className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-card-border bg-surface p-2 shadow-lg">
                  {extraFilterOptions.map(({ key, label }) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 fs-text hover:bg-subtle">
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
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label="Save current filters"
              title="Save current filters"
              className="!size-[36px] !border-primary !text-primary"
              onClick={() => setSaveDialogOpen(true)}
            >
              <Save aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label="Clear filters"
              title="Clear filters"
              className="!size-[36px] !border-primary !text-primary"
              onClick={clearFilters}
            >
              <FilterX aria-hidden="true" />
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
              <table className="w-full min-w-[1695px] text-left fs-text">
                <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
                  <tr>
                    <th className="px-4 py-3">Account number</th>
                    <th className="px-4 py-3">Member name</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Loan officer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Tenure</th>
                    <th className="px-4 py-3 text-right">Loan amount (TSh)</th>
                    <th className="px-4 py-3 text-right">Balance (TSh)</th>
                    <th className="px-4 py-3">Created date</th>
                    <th className="px-4 py-3 text-right">Overdue days</th>
                    <th className="px-4 py-3">Provisioning status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item: Loan) => (
                    <tr key={item.id} className="border-b border-card-border last:border-0">
                      <td className="whitespace-nowrap px-4 py-6 font-medium text-strong">{item.loanNumber}</td>
                      <td className="whitespace-nowrap px-4 py-6 text-body">{item.clientName ?? "N/A"}</td>
                      <td className="whitespace-nowrap px-4 py-6 text-body">{item.productName ?? item.productCode ?? "N/A"}</td>
                      <td className="whitespace-nowrap px-4 py-6 text-body">{item.loanOfficerName ?? "N/A"}</td>
                      <td className="whitespace-nowrap px-4 py-6"><Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{titleCase(item.status)}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-6 text-body">{item.tenureCount} {titleCase(item.tenurePeriod.toLocaleLowerCase())}</td>
                      <td className="whitespace-nowrap px-4 py-6 text-right tabular-nums text-body">{formatMinorUnitsExact(item.principalMinor)}</td>
                      <td className="whitespace-nowrap px-4 py-6 text-right tabular-nums text-body">{formatMinorUnitsExact(item.outstandingPrincipalMinor)}</td>
                      <td className="whitespace-nowrap px-4 py-6 text-body">{new Date(item.createdAt).toLocaleDateString("en-GB").replaceAll("/", "-")}</td>
                      <td className="whitespace-nowrap px-4 py-6 text-right tabular-nums text-body">{item.daysPastDue}</td>
                      <td className="whitespace-nowrap px-4 py-6 text-body">N/A</td>
                      <td className="px-4 py-6">
                        <div className="flex justify-end">
                          <RowActionsMenu label={item.loanNumber} actions={[{ label: "View details", icon: Eye, href: `/account-loan-details/${item.id}` }]} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visibleItems.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="h-[250px] px-4 text-center">
                        <p className="fs-text font-semibold text-strong">{hasFilters ? "No loan matches" : `No ${tab.toLocaleLowerCase()} loans`}</p>
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
        <p className="fs-text text-body">Saved filters are not available for this installation yet.</p>
      </Modal>
    </div>
  );
}
