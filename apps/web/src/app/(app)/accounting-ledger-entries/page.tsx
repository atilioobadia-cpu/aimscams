"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, ChevronDown, Download, FileSpreadsheet, FileText, Scale } from "lucide-react";

import {
  ErrorPanel,
  ForbiddenPanel,
  PanelSkeleton,
} from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import {
  getAccountingSettings,
  getLedger,
  type GlAccount,
  type LedgerPage,
} from "@/lib/accounting";
import { formatTzsExact } from "@/lib/format";
import { cn } from "cn";
import type { ComponentProps } from "react";

const PAGE_SIZE = 50;

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const longDateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function message(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function displayDay(value: string): string {
  return dateFormat.format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

function yearStart(): string {
  return `${new Date().getFullYear()}-01-01`;
}

function yearEnd(): string {
  return `${new Date().getFullYear()}-12-31`;
}

export default function LedgerEntriesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // URLSearchParams lags behind router.replace; keep the live copy in a ref so
  // two date fields changed in a row both survive.
  const paramsRef = useRef(new URLSearchParams(searchParams.toString()));

  const accountId = searchParams.get("accountId") ?? "";
  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  const parsedOffset = Number(searchParams.get("offset") ?? "0");
  const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? Math.trunc(parsedOffset) : 0;

  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [entryType, setEntryType] = useState("");
  const [entryTypeDraft, setEntryTypeDraft] = useState("");
  const [accountDraft, setAccountDraft] = useState("");
  const [dateMode, setDateMode] = useState("on");
  const dateFilterRef = useRef<HTMLDetailsElement>(null);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [accountsForbidden, setAccountsForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<LedgerPage | null>(null);
  const [refresh, setRefresh] = useState(0);

  const fromValue = fromParam || yearStart();
  const toValue = toParam || today();
  const selectedAccountId = accountId || accounts[0]?.id || "";

  useEffect(() => {
    paramsRef.current = new URLSearchParams(searchParams.toString());
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    getAccountingSettings()
      .then((settings) => {
        if (!active) return;
        setAccounts(settings.accounts.filter((account) => account.isPostable));
        setAccountsLoaded(true);
      })
      .catch((failure) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 403) {
          setAccountsForbidden(true);
        } else {
          setError(message(failure, "Could not load the chart of accounts."));
        }
        setAccountsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!accountsLoaded) return;
    if (!selectedAccountId) {
      setPage({ account: null, openingMinor: "0", closingMinor: "0", total: 0, rows: [] });
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    setForbidden(false);
    if (fromValue > toValue) {
      setError("The start date must be on or before the end date.");
      setLoading(false);
      return;
    }
    getLedger({
      accountId: selectedAccountId,
      from: fromValue,
      to: toValue,
      limit: PAGE_SIZE,
      offset,
    })
      .then((result) => {
        if (!active) return;
        setPage(result);
        setLoading(false);
      })
      .catch((failure) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 403) {
          setForbidden(true);
        } else {
          setError(message(failure, "Could not load the ledger."));
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [accountsLoaded, selectedAccountId, fromValue, toValue, offset, refresh]);

  function setParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(paramsRef.current);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (!("offset" in patch)) params.delete("offset");
    paramsRef.current = new URLSearchParams(params);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const rows = page?.rows ?? [];
  const account = page?.account;
  const total = page?.total ?? 0;
  const closing = page?.closingMinor ?? "0";
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + rows.length, total);
  const filteredRows = entryType ? rows.filter((row) => row.eventCode === entryType) : rows;
  const entryTypes = [...new Set([
    "ADJUSTMENT", "FEE_INCOME", "LOAN_DISBURSEMENT", "LOAN_REPAYMENT", "LOAN_WRITE_OFF",
    "MANUAL", "OPENING_BALANCE", "REVERSAL", "SAVINGS_DEPOSIT", "SAVINGS_WITHDRAWAL", "SHARE_CAPITAL",
    ...rows.map((row) => row.eventCode),
  ])].sort();

  function closeFilter(event: SyntheticEvent<HTMLElement>) {
    event.currentTarget.closest("details")?.removeAttribute("open");
  }

  function exportRows(format: "csv" | "excel") {
    const headings = ["Date", "Entry ID", "Details", "Entry Type", "Status", "Ledger Code", "Ledger Name", "Debit (TSh)", "Credit (TSh)"];
    const values = filteredRows.map((row) => [
      displayDay(row.entryDate), row.entryNo, row.description || "N/A", row.eventCode.replace(/_/g, " "), "Posted", account?.code ?? "", account?.name ?? "",
      row.debitMinor === "0" ? "-" : formatTzsExact(row.debitMinor).replace(/^TZS\s*/, ""),
      row.creditMinor === "0" ? "-" : formatTzsExact(row.creditMinor).replace(/^TZS\s*/, ""),
    ]);
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [headings, ...values].map((row) => row.map(escape).join(",")).join("\r\n");
    const content = format === "csv"
      ? new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
      : new Blob([`<html><head><meta charset="utf-8"></head><body><table><thead><tr>${headings.map((heading) => `<th>${heading}</th>`).join("")}</tr></thead><tbody>${values.map((row) => `<tr>${row.map((cell) => `<td>${cell.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(content);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ledger-entries.${format === "csv" ? "csv" : "xls"}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="entries-page ledger-entries-page">
      <header className="ledger-page-header">
        <div className="ledger-heading">
          <BookOpen className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <div><h1>Ledger Entries</h1><p>Ledger Entries from Jan 1, {new Date().getFullYear()} to {longDateFormat.format(new Date(`${today()}T00:00:00`))}</p></div>
        </div>
        <div className="entries-actions">
          <button type="button" className="entries-export" onClick={() => window.print()}><FileText className="size-3.5" aria-hidden="true" />Download PDF</button>
          <button type="button" className="entries-export" onClick={() => exportRows("excel")}><FileSpreadsheet className="size-3.5" aria-hidden="true" />Download Excel</button>
          <button type="button" className="entries-export" onClick={() => exportRows("csv")}><Download className="size-3.5" aria-hidden="true" />Download CSV</button>
          <button type="button" className="entries-period" onClick={() => { dateFilterRef.current?.setAttribute("open", ""); document.getElementById("ledger-from")?.focus(); }}>
            <span>{displayDay(fromParam || yearStart()).replace(/ /g, "-")} to {displayDay(toParam || yearEnd()).replace(/ /g, "-")}</span><ChevronDown className="size-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="ledger-content-card" aria-label="Ledger entries">
        <div className="entries-toolbar ledger-entries-toolbar" role="search" aria-label="Ledger filters">
          <details className="entries-filter ledger-filter-date" ref={dateFilterRef}>
            <summary><span>Date Range</span><ChevronDown className="size-3.5" aria-hidden="true" /></summary>
            <form className="entries-popover" onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const first = String(data.get("date") ?? ""); const second = String(data.get("dateEnd") ?? "");
              let nextFrom: string | null = null; let nextTo: string | null = null;
              if (dateMode === "between") { nextFrom = first || null; nextTo = second || null; }
              else if (dateMode === "on") { nextFrom = first || null; nextTo = first || null; }
              else if (dateMode === "before") nextTo = first ? new Date(new Date(`${first}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10) : null;
              else if (dateMode === "after") nextFrom = first ? new Date(new Date(`${first}T00:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10) : null;
              setParams({ from: nextFrom, to: nextTo }); closeFilter(event);
            }}>
              <strong>Date Range</strong><label>Condition<select value={dateMode} onChange={(event) => setDateMode(event.target.value)}><option value="on">On</option><option value="before">Before</option><option value="after">After</option><option value="between">Between</option></select></label>
              <label>{dateMode === "on" ? "Date" : dateMode === "before" ? "Before" : dateMode === "after" ? "After" : "Start date"}<Input id="ledger-from" name="date" type="date" defaultValue={fromValue} /></label>
              {dateMode === "between" ? <label>End date<Input name="dateEnd" type="date" defaultValue={toValue} /></label> : null}
              <div className="entries-popover-actions"><button type="button" onClick={(event) => { setDateMode("on"); setParams({ from: null, to: null }); closeFilter(event); }}>Clear</button><button type="submit">Apply</button></div>
            </form>
          </details>

          <details className="entries-filter ledger-filter-account" onToggle={(event) => { if (event.currentTarget.open) setAccountDraft(selectedAccountId); }}>
            <summary><span>Ledger Account</span><ChevronDown className="size-3.5" aria-hidden="true" /></summary>
            <form className="entries-popover" onSubmit={(event) => { event.preventDefault(); setParams({ accountId: accountDraft || null }); closeFilter(event); }}>
              <strong>Ledger Account</strong><label>Condition<select value="Is" disabled><option>Is</option></select></label>
              <label>Value<NativeSelect value={accountDraft || selectedAccountId} onChange={(event) => setAccountDraft(event.target.value)} aria-label="Ledger account filter"><option value="">Select an account</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</NativeSelect></label>
              <div className="entries-popover-actions"><button type="button" onClick={(event) => { setAccountDraft(""); setParams({ accountId: null }); closeFilter(event); }}>Clear</button><button type="submit">Apply</button></div>
            </form>
          </details>

          <details className="entries-filter ledger-filter-type">
            <summary><span>Entry Type</span><ChevronDown className="size-3.5" aria-hidden="true" /></summary>
            <form className="entries-popover" onSubmit={(event) => { event.preventDefault(); setEntryType(entryTypeDraft); closeFilter(event); }}>
              <strong>Entry Type</strong><label>Condition<select value="Is" disabled><option>Is</option></select></label>
              <label>Value<select value={entryTypeDraft} onChange={(event) => setEntryTypeDraft(event.target.value)}><option value="">Select value</option>{entryTypes.map((type) => <option key={type} value={type}>{type.replace(/_/g, " ")}</option>)}</select></label>
              <div className="entries-popover-actions"><button type="button" onClick={(event) => { setEntryTypeDraft(""); setEntryType(""); closeFilter(event); }}>Clear</button><button type="submit">Apply</button></div>
            </form>
          </details>
        </div>

      {accountsForbidden || forbidden ? (
        <ForbiddenPanel
          message={
            accountsForbidden
              ? "Your role cannot list ledger accounts. Ask an administrator for Settings Accounting : View."
              : "Your role cannot read the ledger. Ask an administrator for Journal Entry : View."
          }
        />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setRefresh((value) => value + 1)} />
      ) : !accountsLoaded || loading ? (
        <PanelSkeleton rows={8} />
      ) : !selectedAccountId ? (
        <EmptyState
          icon={Scale}
          title="Choose a ledger account"
          description="Pick an account above to see its opening balance, movements and closing balance."
        />
      ) : page && account ? (
        filteredRows.length === 0 ? <div className="ledger-empty-state"><h3>No Entries Found</h3><p>No entries match your current filter criteria.</p></div> :
        <div className="ledger-results">
          <div className="overflow-x-auto">
            <Table className="min-w-[1120px]">
              <TableHeader><TableRow>
                <TableHead className="pl-[var(--space-16)]">Date</TableHead>
                <TableHead>Entry ID</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Entry Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ledger Code</TableHead>
                <TableHead>Ledger Name</TableHead>
                <TableHead className="text-right">Debit (TSh)</TableHead>
                <TableHead className="pr-[var(--space-16)] text-right">Credit (TSh)</TableHead>
              </TableRow></TableHeader>
              <TableBody>
              {filteredRows.map((row) => <TableRow key={row.lineId}>
                  <TableCell className="whitespace-nowrap pl-[var(--space-16)]">{displayDay(row.entryDate)}</TableCell>
                  <TableCell><Link href={`/accounting-entries?entry=${row.entryId}`} className="font-medium text-brand hover:underline">{row.entryNo}</Link></TableCell>
                  <TableCell className="max-w-[260px] truncate" title={row.description}>{row.description || "N/A"}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.eventCode.replace(/_/g, " ")}</TableCell>
                  <TableCell>Posted</TableCell>
                  <TableCell>{account.code}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.debitMinor === "0" ? "—" : formatTzsExact(row.debitMinor).replace(/^TZS\s*/, "")}</TableCell>
                  <TableCell className="pr-[var(--space-16)] text-right tabular-nums">{row.creditMinor === "0" ? "—" : formatTzsExact(row.creditMinor).replace(/^TZS\s*/, "")}</TableCell>
                </TableRow>)}
              </TableBody>
              {filteredRows.length > 0 ? <TableFooter><TableRow><TableCell colSpan={7} className="pl-[var(--space-16)]">Closing balance</TableCell><TableCell className="text-right tabular-nums">{formatTzsExact(closing)}</TableCell><TableCell className="pr-[var(--space-16)]" /></TableRow></TableFooter> : null}
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-chrome px-[var(--space-16)] py-[var(--space-10)] fs-text text-muted-foreground">
            <span>Showing {pageStart}–{pageEnd} of {total}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setParams({ offset: offset - PAGE_SIZE <= 0 ? null : String(offset - PAGE_SIZE) })}>Previous</Button>
              <Button size="sm" variant="outline" disabled={offset + PAGE_SIZE >= total} onClick={() => setParams({ offset: String(offset + PAGE_SIZE) })}>Next</Button>
            </div>
          </div>
        </div>
      ) : null}
      </section>
    </div>
  );
}

function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-10)] fs-text text-foreground transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
