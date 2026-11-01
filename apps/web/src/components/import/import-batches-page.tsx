"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Download, SlidersHorizontal, Upload, UserRound, Search, Plus, ChevronDown, Wallet } from "lucide-react";

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

function downloadTemplate(entity: ImportEntity) {
  const headers = entity === "Member" ? "referenceNo,fullName,clientType,phone,nationalId" : entity === "Account" ? "accountNumber,clientId,accountType,balanceMinor" : "referenceNo,accountNumber,amountMinor,transactionDate";
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
    const matchesStatus = !status || titleCase(item.status) === status;
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
    <div className="space-y-4">
      <PageTitle entity={entity} />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section aria-label={`${entity} import batches`} className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="flex min-h-[72px] flex-wrap items-center gap-2 border-b border-card-border p-3">
          <div className="relative w-full max-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
            <Input aria-label={`Search ${entity.toLowerCase()} imports`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-[42px] border-primary pl-10 text-primary placeholder:text-primary" />
          </div>
          <label className="sr-only" htmlFor="member-import-status">Status filter</label>
          <select id={`import-${kind.toLowerCase()}-status`} value={status} onChange={(event) => setStatus(event.target.value)} style={{ width: 96 }} className="h-[42px] rounded-[var(--control-radius)] border border-primary bg-background px-3 fs-text font-medium text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/50">
            <option value="">Status</option>
            {[...new Set((data?.items ?? []).map((item) => titleCase(item.status)))].map((value) => <option key={value}>{value}</option>)}
          </select>
          <details className="relative">
            <summary className="flex h-[42px] cursor-pointer list-none items-center gap-2 rounded-[var(--control-radius)] border border-primary bg-background px-3 fs-text font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <Plus className="size-4" aria-hidden="true" />Add Filters<ChevronDown className="size-4" aria-hidden="true" />
            </summary>
            <div className="absolute left-0 top-full z-20 mt-2 w-[260px] space-y-3 rounded-md border border-card-border bg-card p-3 shadow-lg">
              <label className="block space-y-1 fs-caption text-label">From date<Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-[38px]" /></label>
              <label className="block space-y-1 fs-caption text-label">To date<Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-[38px]" /></label>
            </div>
          </details>
        </div>

        {loading ? (
          <PanelSkeleton rows={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] table-fixed text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold text-label">
                <tr>
                  {displayedColumns.map((column) => <th key={column.label} scope="col" className={`${column.widthClass} px-4 py-3`}>{column.label}</th>)}
                  <th scope="col" className="relative w-[4%] px-2 py-1 text-center"><span className="sr-only">Actions</span>
                    <details className="relative inline-block text-left">
                      <summary className="flex size-7 cursor-pointer list-none items-center justify-center rounded-[var(--control-radius)] text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" aria-label="Table columns"><SlidersHorizontal className="size-4" aria-hidden="true" /></summary>
                      <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-md border border-card-border bg-card p-2 shadow-lg">
                        {columns.map((column) => <label key={column.label} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 fs-caption text-body hover:bg-subtle"><input type="checkbox" checked={shownColumns.has(column.label)} onChange={() => setVisibleColumns((current) => { const next = new Set(current ?? columns.map((item) => item.label)); next.has(column.label) ? next.delete(column.label) : next.add(column.label); return next; })} />{column.label}</label>)}
                      </div>
                    </details>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={displayedColumns.length + 1} className="h-[216px] px-4 text-center text-muted-foreground"><div className="mx-auto flex max-w-sm flex-col items-center gap-4"><Upload className="size-12" aria-hidden="true" /><span>{query || status || fromDate || toDate ? "No import batches match these filters." : "No data available"}</span></div></td></tr>
                ) : items.map((item: ImportBatch) => (
                  <tr key={item.id} className="h-[67px] border-b border-card-border last:border-0">
                    {displayedColumns.map((column) => <td key={column.label} className={`${column.widthClass} whitespace-nowrap px-4 py-3 text-body ${column.className ?? ""}`} title={column.label === "File" ? item.fileName : column.label === "Batch Reference Id" ? item.reference : undefined}>{column.render(item)}</td>)}
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
  const TitleIcon = entity === "Account" ? Wallet : UserRound;
  return (
    <section className="flex min-h-[88px] flex-wrap items-center justify-between gap-4 rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-4">
      <div className="flex items-center gap-3"><TitleIcon className="size-6 shrink-0 text-primary" aria-hidden="true" /><h1 className="fs-title font-semibold text-heading">{entity} Import</h1></div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild type="button" variant="outline" className="border-primary text-primary hover:bg-primary/5 hover:text-primary"><Link href={`/import-${entity.toLowerCase()}-new`}><Upload aria-hidden="true" />Upload {entity}</Link></Button>
        <Button type="button" variant="outline" onClick={() => downloadTemplate(entity)} className="border-primary text-primary hover:bg-primary/5 hover:text-primary"><Download aria-hidden="true" />{entity} Template</Button>
      </div>
    </section>
  );
}
