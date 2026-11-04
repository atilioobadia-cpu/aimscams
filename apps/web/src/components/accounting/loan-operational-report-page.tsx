"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, ChevronDown, Download, Filter, SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listClients, listLoanOfficers, listLoanProducts } from "@/lib/settings";
import { listBranches } from "@/lib/users";

function isoDate(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function getPeriodDates(period: string) {
  const end = new Date();
  const start = new Date(end);
  if (period === "Today") {
    // Keep both dates on the current local day.
  } else if (period === "This Week") {
    const daysFromMonday = (end.getDay() + 6) % 7;
    start.setDate(end.getDate() - daysFromMonday);
  } else if (period === "This Month") {
    start.setDate(1);
  } else {
    start.setDate(end.getDate() - 29);
  }
  return { start: isoDate(start), end: isoDate(end) };
}

type FilterOptions = Record<string, Array<{ value: string; label: string }>>;

function FilterSelect({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label={`${label} filter`} className="h-[42px] w-full min-w-0 gap-3 rounded-[var(--control-radius)] border-card-border bg-background px-3 fs-text text-body">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.length ? options.map((option) => (
          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
        )) : <SelectItem value="__none" disabled>No options available</SelectItem>}
      </SelectContent>
    </Select>
  );
}

export function LoanOperationalReportPage({
  title,
  columns,
  filename,
  dateMode = "range",
  filters,
  queryField,
  catalogFilters = false,
}: {
  title: string;
  columns: string[];
  filename: string;
  dateMode?: "range" | "as-of" | "none";
  filters?: string[];
  queryField?: { label: string; placeholder: string };
  catalogFilters?: boolean;
}) {
  const initialDates = useMemo(() => {
    return getPeriodDates("Last 30 Days");
  }, []);
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [period, setPeriod] = useState("Last 30 Days");
  const [, setApplied] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const filterLabels = filters ?? (dateMode === "as-of"
    ? ["Group", "MFSL MWANZA", "Region", "Loan Officer", "Product Name"]
    : ["MFSL MWANZA", "Group", "Region", "Loan Officer", "Product Name"]);

  useEffect(() => {
    if (!catalogFilters) return;
    let active = true;
    void Promise.allSettled([
      listBranches(),
      listClients({ type: "GROUP" }),
      listLoanOfficers(),
      listLoanProducts({ status: "ACTIVE" }),
    ]).then(([branchesResult, groupsResult, officersResult, productsResult]) => {
      if (!active) return;
      const branches = branchesResult.status === "fulfilled" ? branchesResult.value : [];
      const groups = groupsResult.status === "fulfilled" ? groupsResult.value.items : [];
      const officers = officersResult.status === "fulfilled" ? officersResult.value.items : [];
      const products = productsResult.status === "fulfilled" ? productsResult.value.items : [];
      const distinctRegions = [...new Set(branches.map((branch) => branch.region).filter(Boolean))];
      setFilterOptions({
        "MFSL MWANZA": branches.map((branch) => ({ value: branch.id, label: branch.name })),
        Group: groups.map((group) => ({ value: group.id, label: group.fullName })),
        Region: distinctRegions.map((region) => ({ value: region, label: region })),
        "Loan Officer": officers.map((officer) => ({ value: officer.id, label: officer.fullName })),
        "Product Name": products.map((product) => ({ value: product.id, label: product.name })),
        Branch: branches.map((branch) => ({ value: branch.id, label: branch.name })),
        Product: products.map((product) => ({ value: product.id, label: product.name })),
      });
    });
    return () => { active = false; };
  }, [catalogFilters]);

  function clearFilters() {
    const dates = getPeriodDates("Last 30 Days");
    setStartDate(dates.start);
    setEndDate(dates.end);
    setPeriod("Last 30 Days");
    setSelectedFilters({});
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6">
          {dateMode === "range" ? (
            <>
              <label className="sr-only" htmlFor="accrued-period">Date range</label>
              <select id="accrued-period" value={period} onChange={(event) => {
                const nextPeriod = event.target.value;
                setPeriod(nextPeriod);
                if (nextPeriod !== "Custom Range") {
                  const dates = getPeriodDates(nextPeriod);
                  setStartDate(dates.start);
                  setEndDate(dates.end);
                }
              }} className="h-[42px] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text text-body">
                <option>Last 30 Days</option><option>Today</option><option>This Week</option><option>This Month</option><option>Custom Range</option>
              </select>
            </>
          ) : null}
          {dateMode !== "none" ? <>
          <label className="sr-only" htmlFor="accrued-start-date">{dateMode === "as-of" ? "As of date" : "Start date"}</label>
          <input id="accrued-start-date" type="date" disabled={dateMode === "range" && period !== "Custom Range"} value={dateMode === "as-of" ? endDate : startDate} onChange={(event) => { if (dateMode === "as-of") setEndDate(event.target.value); else { setStartDate(event.target.value); setPeriod("Custom Range"); } }} className="h-[42px] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text text-body disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted-foreground" />
          </> : null}
          {dateMode === "range" ? <>
            <label className="sr-only" htmlFor="accrued-end-date">End date</label>
            <input id="accrued-end-date" type="date" disabled={period !== "Custom Range"} value={endDate} onChange={(event) => { setEndDate(event.target.value); setPeriod("Custom Range"); }} className="h-[42px] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text text-body disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted-foreground" />
          </> : null}
          {queryField ? <input aria-label={queryField.label} placeholder={queryField.placeholder} className="h-[42px] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text text-body" /> : null}
          {filterLabels.map((label) => (
            <FilterSelect
              key={label}
              label={label}
              value={selectedFilters[label] ?? ""}
              options={filterOptions[label] ?? []}
              onChange={(value) => setSelectedFilters((current) => ({ ...current, [label]: value }))}
              disabled={!catalogFilters}
            />
          ))}
          <div className="flex items-center gap-2">
            {dateMode !== "none" || queryField || filterLabels.length ? <>
              <Button type="button" onClick={() => setApplied((value) => value + 1)} className="h-[42px] px-4">Submit</Button>
              <Button type="button" variant="outline" onClick={clearFilters} className="h-[42px] border-primary px-4 text-primary hover:bg-primary/5 hover:text-primary">Clear</Button>
            </> : null}
          </div>
        </div>
      </section>

      <section aria-label={`${title} results`} className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left fs-text" style={{ minWidth: `${Math.max(960, columns.length * 145 + 48)}px` }}>
            <thead className="border-b border-card-border bg-subtle font-semibold text-label">
              <tr>
                {columns.map((column) => (
                  <th key={column} scope="col" className="min-w-[132px] px-4 py-4">
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
