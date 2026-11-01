"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, SlidersHorizontal, Upload, UserRound, Search, Plus, ChevronDown } from "lucide-react";

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

function downloadMemberTemplate() {
  const blob = new Blob(["referenceNo,fullName,clientType,phone,nationalId\n"], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "member-import-template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function MemberImportBatchesPage() {
  const [data, setData] = useState<ImportBatchList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listImportBatches("MEMBER")
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
  }, [reloadKey]);

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

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageTitle />
        <ForbiddenPanel message="Your role cannot view import batches. Ask an administrator for Import : View." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section aria-label="Member import batches" className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="flex min-h-[72px] flex-wrap items-center gap-2 border-b border-card-border p-3">
          <div className="relative w-full max-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
            <Input aria-label="Search member imports" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-[42px] border-primary pl-10 text-primary placeholder:text-primary" />
          </div>
          <label className="sr-only" htmlFor="member-import-status">Status filter</label>
          <select id="member-import-status" value={status} onChange={(event) => setStatus(event.target.value)} style={{ width: 96 }} className="h-[42px] rounded-[var(--control-radius)] border border-primary bg-background px-3 fs-text font-medium text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/50">
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
          <Button type="button" variant="ghost" size="icon" aria-label="Table columns" title="Table columns" className="ml-auto text-primary hover:bg-primary/5 hover:text-primary">
            <SlidersHorizontal aria-hidden="true" />
          </Button>
        </div>

        {loading ? (
          <PanelSkeleton rows={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] table-fixed text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold text-label">
                <tr>
                  <th scope="col" className="w-[4%] px-4 py-3">Id</th>
                  <th scope="col" className="w-[24%] px-4 py-3">File</th>
                  <th scope="col" className="w-[14%] px-4 py-3">Batch Reference Id</th>
                  <th scope="col" className="w-[8%] px-4 py-3">Date</th>
                  <th scope="col" className="w-[9%] px-4 py-3">Status</th>
                  <th scope="col" className="w-[10%] px-4 py-3">Total Records</th>
                  <th scope="col" className="w-[12%] px-4 py-3">Uploaded Records</th>
                  <th scope="col" className="w-[15%] px-4 py-3">Uploaded By</th>
                  <th scope="col" className="w-[4%] px-3 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={9} className="h-[216px] px-4 text-center text-muted-foreground"><div className="mx-auto flex max-w-sm flex-col items-center gap-4"><Upload className="size-12" aria-hidden="true" /><span>{query || status || fromDate || toDate ? "No import batches match these filters." : "No data available"}</span></div></td></tr>
                ) : items.map((item: ImportBatch) => (
                  <tr key={item.id} className="h-[67px] border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.id.slice(0, 8)}</td>
                    <td className="truncate px-4 py-3 text-body" title={item.fileName}>{item.fileName}</td>
                    <td className="truncate px-4 py-3 text-body" title={item.reference}>{item.reference}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{formatDate(item.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><span className={`inline-flex rounded-md px-2 py-1 fs-caption font-medium ${item.status === "COMPLETED" ? "bg-primary/10 text-primary" : "bg-subtle text-body"}`}>{titleCase(item.status)}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{item.totalRows}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{item.successRows}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">Unavailable</td>
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

function PageTitle() {
  return (
    <section className="flex min-h-[88px] flex-wrap items-center justify-between gap-4 rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-4">
      <div className="flex items-center gap-3"><UserRound className="size-6 shrink-0 text-primary" aria-hidden="true" /><h1 className="fs-title font-semibold text-heading">Member Import</h1></div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild type="button" variant="outline" className="border-primary text-primary hover:bg-primary/5 hover:text-primary"><Link href="/import-member-new"><Upload aria-hidden="true" />Upload Member</Link></Button>
        <Button type="button" variant="outline" onClick={downloadMemberTemplate} className="border-primary text-primary hover:bg-primary/5 hover:text-primary"><Download aria-hidden="true" />Member Template</Button>
      </div>
    </section>
  );
}
