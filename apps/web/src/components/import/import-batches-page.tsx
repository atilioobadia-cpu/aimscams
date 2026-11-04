"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Download, SlidersHorizontal, Upload, UserRound, Search, Plus, ChevronDown, Wallet, ReceiptText } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { titleCase } from "@/lib/privacy";
import { listImportBatches, type ImportBatch, type ImportBatchList } from "@/lib/settings";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load import batches.";
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-GB").format(date).replaceAll("/", "-");
}

type ImportKind = "MEMBER" | "ACCOUNT" | "TRANSACTION";
type ImportEntity = "Member" | "Account" | "Transaction";

const IMPORT_STATUS_FILTERS = ["Uploaded", "In Progress", "New", "Verified", "Submitted", "Error", "Success", "Archive", "Deleted", "Deleting", "Pending"];

function importStatusLabel(value: string): string {
  const normalized = value.trim().toUpperCase().replaceAll(/[ _-]+/g, " ");
  const aliases: Record<string, string> = {
    COMPLETED: "Success",
    COMPLETE: "Success",
    FAILED: "Error",
    PROCESSING: "In Progress",
    "IN PROGRESS": "In Progress",
    ARCHIVED: "Archive",
  };
  return aliases[normalized] ?? titleCase(value.replaceAll("_", " "));
}

function downloadTemplate(entity: ImportEntity) {
  const headers = entity === "Member" ? "referenceNo,fullName,clientType,phone,nationalId" : entity === "Account" ? "accountNumber,clientId,accountType,balanceMinor" : "transactionNo,type,amountMinor,clientId";
  const blob = new Blob([`${headers}\n`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${entity.toLowerCase()}-import-template.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ImportBatchesPage({ kind, entity }: { kind: ImportKind; entity: ImportEntity }) {
  const [data, setData] = useState<ImportBatchList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Set<string> | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listImportBatches(kind)
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
  }, [reloadKey, kind]);

  const items = useMemo(() => (data?.items ?? []).filter((item) => {
    const search = query.trim().toLowerCase();
    const matchesSearch = !search || [item.reference, item.fileName, item.id].some((value) => value.toLowerCase().includes(search));
    const matchesStatus = !status || importStatusLabel(item.status) === status;
    const created = new Date(item.createdAt);
    const matchesFrom = !fromDate || created >= new Date(`${fromDate}T00:00:00`);
    const toDateExclusive = toDate ? new Date(`${toDate}T00:00:00`) : null;
    if (toDateExclusive) toDateExclusive.setDate(toDateExclusive.getDate() + 1);
    const matchesTo = !toDateExclusive || created < toDateExclusive;
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  }), [data, query, status, fromDate, toDate]);
  const columns: { label: string; render: (item: ImportBatch) => ReactNode; className?: string; widthClass: string }[] = [
    { label: "Id", render: (item) => item.id.slice(0, 8), widthClass: "w-[4%]" },
    { label: "File", render: (item) => item.fileName, className: "truncate", widthClass: "w-[20%]" },
    { label: "Batch Reference Id", render: (item) => item.reference, className: "truncate", widthClass: "w-[15%]" },
    { label: "Date", render: (item) => formatDate(item.createdAt), widthClass: "w-[8%]" },
    ...(kind === "ACCOUNT" ? [{ label: "Template Type", render: (_item: ImportBatch) => "—", widthClass: "w-[10%]" }] : []),
    { label: "Status", render: (item) => <span className={`inline-flex rounded-md px-2 py-1 fs-caption font-medium ${item.status === "COMPLETED" ? "bg-primary/10 text-primary" : "bg-subtle text-body"}`}>{titleCase(item.status)}</span>, widthClass: "w-[8%]" },
    { label: "Total Records", render: (item) => item.totalRows, widthClass: "w-[10%]" },
    { label: "Uploaded Records", render: (item) => item.successRows, widthClass: "w-[12%]" },
    { label: "Uploaded By", render: (_item) => "Unavailable", widthClass: "w-[9%]" },
  ];
  const shownColumns = visibleColumns ?? new Set(columns.map((column) => column.label));
  const displayedColumns = columns.filter((column) => shownColumns.has(column.label));

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageTitle entity={entity} />
        <ForbiddenPanel message="Your role cannot view import batches. Ask an administrator for Import : View." />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageTitle entity={entity} />

      {error ? <div className="mt-4"><ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /></div> : null}

      <section aria-label={`${entity} import batches`} className="mt-[35px] overflow-x-hidden">
        <div className="flex min-h-[56px] flex-wrap items-center gap-[7.5px] rounded-[6px] border border-card-border bg-card p-2.5">
          <div className="relative w-full max-w-[191px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
            <Input aria-label={`Search ${entity.toLowerCase()} imports`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-[35px] border-primary pl-10 text-primary placeholder:text-primary" />
          </div>
          <details className="relative">
            <summary aria-label="Filter by Status" className="flex h-[35px] w-[75.53px] cursor-pointer list-none items-center justify-between gap-[6.72px] rounded-[6px] border border-primary !bg-white px-[8.4px] text-[11.76px] font-medium leading-[17.64px] text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              Status<ChevronDown className="size-3.5" aria-hidden="true" />
            </summary>
            <div className="absolute left-0 top-full z-30 mt-1 w-[260px] rounded-md border border-card-border bg-card p-3 shadow-lg">
              <label className="mb-3 block space-y-1 fs-caption text-label">Condition
                <select aria-label="Status condition" value="Is" disabled className="h-[35px] w-full rounded-[6px] border border-card-border bg-background px-2.5 fs-text text-body"><option>Is</option></select>
              </label>
              <label className="block space-y-1 fs-caption text-label">Value
                <select aria-label="Status value" value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)} className="h-[35px] w-full rounded-[6px] border border-card-border bg-background px-2.5 fs-text text-body">
                  <option value="">Select value</option>
                  {IMPORT_STATUS_FILTERS.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" disabled={!status && !draftStatus} onClick={(event) => { setStatus(""); setDraftStatus(""); event.currentTarget.closest("details")?.removeAttribute("open"); }} className="h-[29px] rounded-[6px] border border-card-border px-2.5 fs-caption text-body disabled:cursor-not-allowed disabled:opacity-50">Clear</button>
                <button type="button" disabled={!draftStatus} onClick={(event) => { setStatus(draftStatus); event.currentTarget.closest("details")?.removeAttribute("open"); }} className="h-[29px] rounded-[6px] border border-primary bg-primary px-2.5 fs-caption font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">Apply</button>
              </div>
            </div>
          </details>
          <details className="relative">
            <summary className="flex h-[35px] w-[132.1px] cursor-pointer list-none items-center justify-between gap-[6.72px] rounded-[6px] border border-primary !bg-white px-[8.4px] text-[11.76px] font-medium leading-[17.64px] text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <Plus className="size-3.5" aria-hidden="true" />Add Filters<ChevronDown className="size-3.5" aria-hidden="true" />
            </summary>
            <div className="absolute left-0 top-full z-20 mt-1 w-[260px] space-y-3 rounded-md border border-card-border bg-card p-3 shadow-lg">
              <label className="block space-y-1 fs-caption text-label">From date<Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-[38px]" /></label>
              <label className="block space-y-1 fs-caption text-label">To date<Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-[38px]" /></label>
            </div>
          </details>
        </div>

        {loading ? (
          <PanelSkeleton rows={6} />
        ) : (
          <div className="overflow-x-auto bg-card">
            <table className="w-full min-w-[997px] table-fixed text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold text-label">
                <tr>
                  {displayedColumns.map((column) => <th key={column.label} scope="col" style={{ height: 38.95, padding: "8.45px 13.44px" }} className={`${column.widthClass}`}>{column.label}</th>)}
                  <th scope="col" className="relative w-[4%] px-2 py-1 text-center"><span className="sr-only">Actions</span>
                    <details className="relative inline-block text-left">
                      <summary className="flex size-4 cursor-pointer list-none items-center justify-center rounded-[var(--control-radius)] text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" aria-label="Table columns"><SlidersHorizontal className="size-4" aria-hidden="true" /></summary>
                      <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-md border border-card-border bg-card p-2 shadow-lg">
                        {columns.map((column) => <label key={column.label} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 fs-caption text-body hover:bg-subtle"><input type="checkbox" checked={shownColumns.has(column.label)} onChange={() => setVisibleColumns((current) => { const next = new Set(current ?? columns.map((item) => item.label)); next.has(column.label) ? next.delete(column.label) : next.add(column.label); return next; })} />{column.label}</label>)}
                      </div>
                    </details>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={displayedColumns.length + 1} style={{ height: 171.2, padding: "10.08px 13.44px" }} className="text-center text-muted-foreground"><div className="mx-auto flex max-w-sm flex-col items-center gap-3"><Upload className="size-9" aria-hidden="true" /><span>{query || status || fromDate || toDate ? "No import batches match these filters." : "No data available"}</span></div></td></tr>
                ) : items.map((item: ImportBatch) => (
                  <tr key={item.id} className="h-[52px] border-b border-card-border last:border-0">
                    {displayedColumns.map((column) => <td key={column.label} style={{ padding: "10.08px 13.44px" }} className={`${column.widthClass} whitespace-nowrap text-body ${column.className ?? ""}`} title={column.label === "File" ? item.fileName : column.label === "Batch Reference Id" ? item.reference : undefined}>{column.render(item)}</td>)}
                    <td className="px-3 py-3 text-right text-muted-foreground">—</td>
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

function PageTitle({ entity }: { entity: ImportEntity }) {
  const TitleIcon = entity === "Account" ? Wallet : entity === "Transaction" ? ReceiptText : UserRound;
  return (
    <header className="mt-5 flex h-[29px] flex-wrap items-center justify-between gap-4 px-5">
      <div className="flex items-center gap-2.5"><TitleIcon className="size-5 shrink-0 text-primary" aria-hidden="true" /><h1 className="relative -top-0.5 fs-title font-semibold text-heading">{entity} Import</h1></div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild type="button" variant="outline" className="h-[29px] rounded-[6px] !border-primary !px-[8.4px] !text-[11.76px] !leading-[14px] !gap-[6.72px] text-primary hover:bg-primary/5 hover:text-primary [&_svg]:!size-[11.76px]"><Link href={`/import-${entity.toLowerCase()}-new`}><Upload aria-hidden="true" />Upload {entity}</Link></Button>
        <Button type="button" variant="outline" onClick={() => downloadTemplate(entity)} className="h-[29px] rounded-[6px] !border-primary !px-[8.4px] !text-[11.76px] !leading-[14px] !gap-[6.72px] text-primary hover:bg-primary/5 hover:text-primary [&_svg]:!size-[11.76px]"><Download aria-hidden="true" />{entity} Template</Button>
      </div>
    </header>
  );
}
