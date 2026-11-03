"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, ChevronDown, Download, Filter, SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";

function isoDate(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function FilterSelect({ label, disabled = false }: { label: string; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} aria-label={`${label} filter`} className="flex h-[42px] min-w-0 items-center justify-between gap-3 rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text text-body disabled:cursor-not-allowed disabled:opacity-90">
      <span className="truncate">{label}</span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}

export function LoanOperationalReportPage({
  title,
  columns,
  filename,
  dateMode = "range",
}: {
  title: string;
  columns: string[];
  filename: string;
  dateMode?: "range" | "as-of";
}) {
  const initialDates = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return { start: isoDate(start), end: isoDate(end) };
  }, []);
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [period, setPeriod] = useState("Last 30 Days");
  const [, setApplied] = useState(0);

  function clearFilters() {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    setStartDate(isoDate(start));
    setEndDate(isoDate(end));
    setPeriod("Last 30 Days");
    setApplied((value) => value + 1);
  }

  function downloadCsv() {
    const csv = `${columns.map((column) => `"${column}"`).join(",")}\r\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        variant="card"
        title={title}
        actions={(
          <Button type="button" variant="outline" onClick={downloadCsv} className="h-[42px] gap-2 border-primary px-4 text-primary hover:bg-primary/5 hover:text-primary">
            <Download aria-hidden="true" />Download<ChevronDown className="size-4" aria-hidden="true" />
          </Button>
        )}
      />

      <section aria-label={`${title} filters`} className="rounded-[var(--card-radius)] border border-card-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          {dateMode === "range" ? (
            <>
              <label className="sr-only" htmlFor="accrued-period">Date range</label>
              <select id="accrued-period" value={period} onChange={(event) => setPeriod(event.target.value)} className="h-[42px] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text text-body">
                <option>Last 30 Days</option><option>Today</option><option>This Week</option><option>This Month</option><option>Custom Range</option>
              </select>
            </>
          ) : null}
          <label className="sr-only" htmlFor="accrued-start-date">{dateMode === "as-of" ? "As of date" : "Start date"}</label>
          <input id="accrued-start-date" type="date" value={dateMode === "as-of" ? endDate : startDate} onChange={(event) => { if (dateMode === "as-of") setEndDate(event.target.value); else { setStartDate(event.target.value); setPeriod("Custom Range"); } }} className="h-[42px] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text text-body" />
          {dateMode === "range" ? <>
            <label className="sr-only" htmlFor="accrued-end-date">End date</label>
            <input id="accrued-end-date" type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setPeriod("Custom Range"); }} className="h-[42px] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text text-body" />
          </> : null}
          {dateMode === "as-of" ? <FilterSelect label="Group" disabled /> : <FilterSelect label="MFSL MWANZA" disabled />}
          {dateMode === "as-of" ? <FilterSelect label="MFSL MWANZA" disabled /> : <FilterSelect label="Group" disabled />}
          <FilterSelect label="Region" disabled />
          <FilterSelect label="Loan Officer" disabled />
          <FilterSelect label="Product Name" disabled />
          <div className="flex items-center gap-2">
            <Button type="button" onClick={() => setApplied((value) => value + 1)} className="h-[42px] px-4">Submit</Button>
            <Button type="button" variant="outline" onClick={clearFilters} className="h-[42px] border-primary px-4 text-primary hover:bg-primary/5 hover:text-primary">Clear</Button>
          </div>
        </div>
      </section>

      <section aria-label={`${title} results`} className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed text-left fs-text">
            <thead className="border-b border-card-border bg-subtle font-semibold text-label">
              <tr>
                {columns.map((column) => (
                  <th key={column} scope="col" className="px-4 py-4">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <span className="whitespace-nowrap">{column}</span>
                      <span className="flex shrink-0 items-center gap-3 text-label" aria-hidden="true"><ArrowDownUp className="size-4" /><Filter className="size-4" /></span>
                    </div>
                  </th>
                ))}
                <th scope="col" className="w-12 px-3 py-4"><SlidersHorizontal className="size-4" aria-label="Table columns" /></th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={columns.length + 1} className="h-[132px] px-4 text-center text-muted-foreground">No {title} data found.</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
