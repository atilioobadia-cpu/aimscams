"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Eye,
  FileText,
  FilterX,
  Inbox,
  Plus,
  Save,
  Search,
  X,
} from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { ColumnPicker } from "@/components/data/column-picker";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api";
import { formatMinorUnitsExact } from "@/lib/format";
import { listLoanApplications, listLoanOfficers, type LoanApplication, type LoanApplicationStatus, type LoanOfficer } from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function initials(value: string | null): string {
  return value?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase() || "—";
}

function dateLabel(value: string): string {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

const statusGroups = {
  Pending: ["DRAFT", "SUBMITTED"],
  Approved: ["APPROVED"],
  All: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"],
} as const;

type ApplicationTab = keyof typeof statusGroups;
type ExtraFilter = "status" | "product" | "tenure";

const extraFilterOptions: Array<{ key: ExtraFilter; label: string }> = [
  { key: "status", label: "Status" },
  { key: "product", label: "Product" },
  { key: "tenure", label: "Tenure period" },
];

const applicationStatuses: LoanApplicationStatus[] = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"];

type ApplicationColumnKey = "memberName" | "product" | "loanOfficer" | "stage" | "status" | "tenure" | "tenurePeriod" | "createdDate" | "loanAmount";
const applicationColumnDefaults: Record<ApplicationColumnKey, boolean> = { memberName: true, product: true, loanOfficer: true, stage: true, status: true, tenure: true, tenurePeriod: true, createdDate: true, loanAmount: true };
const applicationColumns: Array<{ key: ApplicationColumnKey; label: string }> = [
  { key: "memberName", label: "Member Name" }, { key: "product", label: "Product" }, { key: "loanOfficer", label: "Loan Officer" },
  { key: "stage", label: "Stage" }, { key: "status", label: "Status" }, { key: "tenure", label: "Tenure" },
  { key: "tenurePeriod", label: "Tenure Period" }, { key: "createdDate", label: "Created Date" }, { key: "loanAmount", label: "Loan Amount" },
];

export default function LoanApplicationsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof listLoanApplications>> | null>(null);
  const [officers, setOfficers] = useState<LoanOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ApplicationTab>("Pending");
  const [status, setStatus] = useState<LoanApplicationStatus | "">("");
  const [officerId, setOfficerId] = useState("");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [extraFilterFields, setExtraFilterFields] = useState<ExtraFilter[]>(["status"]);
  const [extraFilters, setExtraFilters] = useState<Record<ExtraFilter, string>>({ status: "", product: "", tenure: "" });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<ApplicationColumnKey, boolean>>(applicationColumnDefaults);
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);
        void listLoanApplications({ q: query })
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
              setError(message(failure, "Could not load loan applications."));
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
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    void listLoanOfficers()
      .then((response) => { if (!cancelled) setOfficers(response.items); })
      .catch(() => { if (!cancelled) setOfficers([]); });
    return () => { cancelled = true; };
  }, []);

  const items = useMemo(() => data?.items ?? [], [data]);
  const visibleItems = useMemo(() => items.filter((item) => {
    if (!(statusGroups[tab] as readonly string[]).includes(item.status)) return false;
    if (extraFilterFields.includes("status") && status && item.status !== status) return false;
    if (officerId && item.loanOfficerId !== officerId) return false;
    return extraFilterFields.filter((key) => key !== "status").every((key) => {
      const value = extraFilters[key].trim().toLocaleLowerCase();
      if (!value) return true;
      const fieldValue = key === "product"
        ? `${item.productName ?? ""} ${item.productCode ?? ""}`
        : titleCase(item.tenurePeriod.toLocaleLowerCase());
      return fieldValue.toLocaleLowerCase().includes(value);
    });
  }), [items, tab, status, officerId, extraFilterFields, extraFilters]);
  const hasFilters = Boolean(query.trim() || status || officerId || Object.values(extraFilters).some((value) => value.trim()));

  function clearFilters() {
    setQuery("");
    setTab("Pending");
    setStatus("");
    setOfficerId("");
    setExtraFilterFields(["status"]);
    setExtraFilters({ status: "", product: "", tenure: "" });
    setFilterMenuOpen(false);
  }

  return (
    <div className="space-y-[15px]">
      <PageHeader
        variant="card"
        icon={<FileText className="size-[19.33px] shrink-0 text-primary" aria-hidden="true" />}
        title="Loan Applications"
        className="min-h-[69.33px] px-[19.33px] py-0 sm:pl-[20.67px] sm:pr-[19.33px] [&>div:first-child]:gap-[10.67px] [&_h1]:!font-semibold [&_h2]:!font-semibold"
        actions={data?.canCreate ? (
          <Button asChild variant="outline" className="!h-[28.77px] !gap-[4px] !rounded-[6px] !border-primary !px-[8.4px] !text-[11.76px] font-medium text-primary">
            <Link href="/account-loan-application-create"><Plus className="size-[14px]" aria-hidden="true" />New Loan Application</Link>
          </Button>
        ) : null}
      />

      <div role="tablist" aria-label="Loan application status" className="flex h-[45px] items-stretch border-b border-card-border bg-surface px-0">
        {(Object.keys(statusGroups) as ApplicationTab[]).map((label) => (
          <button
            key={label}
            type="button"
            role="tab"
            id={`loan-app-tab-${label.toLocaleLowerCase()}`}
            aria-selected={tab === label}
            aria-controls="loan-application-list-panel"
            tabIndex={tab === label ? 0 : -1}
            className={`h-[45px] min-w-[80px] border-b-2 px-[16.8px] py-0 text-[13.33px] font-medium transition-colors hover:bg-subtle ${tab === label ? "border-primary bg-white font-semibold text-primary" : "border-transparent bg-[#f8fafc] text-[#6c757d]"}`}
            onClick={() => setTab(label)}
            onKeyDown={(event) => {
              const labels = Object.keys(statusGroups) as ApplicationTab[];
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
              event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`#loan-app-tab-${nextTab.toLocaleLowerCase()}`)?.focus();
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <section
        id="loan-application-list-panel"
        role="tabpanel"
        aria-labelledby={`loan-app-tab-${tab.toLocaleLowerCase()}`}
        tabIndex={0}
        className="mx-5 !mt-[15px] overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface"
      >
        <div className="min-h-[56px] border-b border-card-border p-[10.08px]">
          <div className="flex flex-col gap-[6.72px] sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[191px] sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="loan-application-search"
                aria-label="Search loan applications"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                className="!h-[34px] !rounded-[6px] !border-primary !pl-[33.6px] !pr-[10.08px] !py-[8.4px]"
              />
            </div>
            <div className="w-full sm:w-[106px]">
              <label className="sr-only" htmlFor="loan-application-officer">Loan officer</label>
              <select id="loan-application-officer" aria-label="Loan officer" value={officerId} onChange={(event) => setOfficerId(event.target.value)} className="h-[35px] w-full rounded-[6px] !border-primary bg-background px-[8.4px] text-[11.76px] font-medium text-primary">
                <option value="">Loan officer</option>
                {officers.map((officer) => <option key={officer.id} value={officer.id}>{officer.fullName}</option>)}
              </select>
            </div>
            {extraFilterFields.includes("status") ? (
              <div className="flex w-full sm:w-[131px]">
                <label className="sr-only" htmlFor="loan-application-status">Status</label>
                <select id="loan-application-status" aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value as LoanApplicationStatus | "")} className="h-[35px] min-w-0 flex-1 rounded-l-[6px] rounded-r-none !border-primary bg-background px-[8.4px] text-[11.76px] font-medium text-primary">
                  <option value="">Status</option>
                  {applicationStatuses.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}
                </select>
                <Button type="button" variant="outline" size="icon-lg" aria-label="Remove Status filter" title="Remove Status filter" className="!h-[27px] !w-[30px] !rounded-l-none !border-primary !border-l-0 !text-primary" onClick={() => { setExtraFilterFields((current) => current.filter((field) => field !== "status")); setStatus(""); }}><X aria-hidden="true" /></Button>
              </div>
            ) : null}
            <div className="relative w-full sm:w-[90px]">
              <Button type="button" variant="outline" aria-label="Add filters" title="Add filters" aria-expanded={filterMenuOpen} aria-controls="loan-application-extra-filters" className="w-full justify-between !border-primary !text-primary" onClick={() => setFilterMenuOpen((open) => !open)}>
                <span>{extraFilterFields.length} added</span><ChevronDown aria-hidden="true" />
              </Button>
              {filterMenuOpen ? (
                <div id="loan-application-extra-filters" role="group" aria-label="Additional loan application filters" className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-card-border bg-surface p-2 shadow-lg">
                  {extraFilterOptions.map(({ key, label }) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 fs-text hover:bg-subtle">
                      <input type="checkbox" checked={extraFilterFields.includes(key)} onChange={(event) => {
                        setExtraFilterFields((current) => event.target.checked ? [...current, key] : current.filter((field) => field !== key));
                        if (!event.target.checked) {
                          setExtraFilters((current) => ({ ...current, [key]: "" }));
                          if (key === "status") setStatus("");
                        }
                      }} />
                      {label}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
            <Button type="button" variant="outline" size="icon-lg" aria-label="Save current filters" title="Save current filters" className="!h-[27px] !w-[30px] !rounded-[6px] !border-primary !text-primary" onClick={() => setSaveDialogOpen(true)}><Save aria-hidden="true" /></Button>
            <Button type="button" variant="outline" size="icon-lg" aria-label="Clear filters" title="Clear filters" className="!h-[27px] !w-[30px] !rounded-[6px] !border-primary !text-primary" onClick={clearFilters}><FilterX aria-hidden="true" /></Button>
          </div>
          {extraFilterFields.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {extraFilterOptions.filter(({ key }) => key !== "status" && extraFilterFields.includes(key)).map(({ key, label }) => (
                <Input key={key} aria-label={label} placeholder={label} value={extraFilters[key]} onChange={(event) => setExtraFilters((current) => ({ ...current, [key]: event.target.value }))} className="h-[var(--control-height)] w-full sm:w-[230px]" />
              ))}
            </div>
          ) : null}
        </div>

        {forbidden ? (
          <ForbiddenPanel message="Your role cannot view loan applications. Ask an administrator for Loan Account : View." />
        ) : error ? (
          <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
        ) : loading ? (
          <PanelSkeleton rows={8} />
        ) : (
          <div className="table-scroll overflow-x-auto">
            <table className="w-full min-w-full text-left fs-text">
              <thead className="border-b border-card-border bg-[#f8fafc] fs-text font-bold tracking-wide text-[#495057]">
                <tr>
                  <th hidden={!visibleColumns.memberName} className="!h-[37px] !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Member Name</th>
                  <th hidden={!visibleColumns.product} className="!h-[37px] !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Product</th>
                  <th hidden={!visibleColumns.loanOfficer} className="!h-[37px] !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Loan Officer</th>
                  <th hidden={!visibleColumns.stage} className="!h-[37px] !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Stage</th>
                  <th hidden={!visibleColumns.status} className="!h-[37px] !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Status</th>
                  <th hidden={!visibleColumns.tenure} className="!h-[37px] !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Tenure</th>
                  <th hidden={!visibleColumns.tenurePeriod} className="!h-[37px] !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Tenure Period</th>
                  <th hidden={!visibleColumns.createdDate} className="!h-[37px] !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Created Date</th>
                  <th hidden={!visibleColumns.loanAmount} className="!h-[37px] !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057] text-right">Loan Amount (TSh)</th>
                  <th className="!h-[37px] !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057] text-right"><ColumnPicker columns={applicationColumns} visible={visibleColumns} onToggle={(key, checked) => setVisibleColumns((current) => ({ ...current, [key]: checked }))} onReset={() => setVisibleColumns(applicationColumnDefaults)} /></th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item: LoanApplication) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td hidden={!visibleColumns.memberName} className="whitespace-nowrap px-4 py-6 text-body"><span className="inline-flex items-center gap-3"><span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-tint fs-text font-semibold text-primary">{initials(item.clientName)}</span>{item.clientName ?? "N/A"}</span></td>
                    <td hidden={!visibleColumns.product} className="whitespace-nowrap px-4 py-6 text-body">{item.productName ?? item.productCode ?? "N/A"}</td>
                    <td hidden={!visibleColumns.loanOfficer} className="whitespace-nowrap px-4 py-6 text-body">{item.loanOfficerName ? <span className="inline-flex items-center gap-3"><span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-tint fs-text font-semibold text-primary">{initials(item.loanOfficerName)}</span>{item.loanOfficerName}</span> : "—"}</td>
                    <td hidden={!visibleColumns.stage} className="whitespace-nowrap px-4 py-6 text-body">—</td>
                    <td hidden={!visibleColumns.status} className="whitespace-nowrap px-4 py-6"><Badge variant={item.status === "APPROVED" ? "default" : "outline"}>{titleCase(item.status)}</Badge></td>
                    <td hidden={!visibleColumns.tenure} className="whitespace-nowrap px-4 py-6 text-body">{item.tenureCount}</td>
                    <td hidden={!visibleColumns.tenurePeriod} className="whitespace-nowrap px-4 py-6 text-body">{titleCase(item.tenurePeriod.toLocaleLowerCase())}</td>
                    <td hidden={!visibleColumns.createdDate} className="whitespace-nowrap px-4 py-6 text-body">{dateLabel(item.createdAt)}</td>
                    <td hidden={!visibleColumns.loanAmount} className="whitespace-nowrap px-4 py-6 text-right tabular-nums text-body">{formatMinorUnitsExact(item.principalMinor)}</td>
                    <td className="px-4 py-6"><div className="flex justify-end"><RowActionsMenu label={item.applicationNo} actions={[
                      { label: "View details", icon: Eye, onSelect: () => router.push(`/account-loan-application-details/${item.id}`) },
                      ...(item.status === "DRAFT" || item.status === "SUBMITTED" ? [{ label: "Edit application", icon: Eye, onSelect: () => router.push(`/account-loan-application-edit/${item.id}`) }] : []),
                    ]} /></div></td>
                  </tr>
                ))}
                {visibleItems.length === 0 ? (
                  <tr><td colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="h-[172px] px-[13.44px] text-center"><div className="flex flex-col items-center justify-center gap-2 text-[#6c757d]"><Inbox className="size-[40px]" aria-hidden="true" /><p className="fs-text">No data available</p></div></td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} title="Save current filters" footer={<Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Close</Button>}>
        <p className="fs-text text-body">Saved filters are not available for this installation yet.</p>
      </Modal>


    </div>
  );
}
