"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  ErrorPanel,
  ForbiddenPanel,
  FormError,
  PanelSkeleton,
} from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
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
  createJournalEntry,
  getAccountingSettings,
  getJournalEntry,
  listJournalEntries,
  parseMajorToMinor,
  postJournalEntry,
  reverseJournalEntry,
  type GlAccount,
  type JournalEntryDetail,
  type JournalEntrySummary,
  type PostingPolicy,
} from "@/lib/accounting";
import { formatTzsExact } from "@/lib/format";
import { cn } from "cn";

const PAGE_SIZE = 10;

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function message(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function displayDay(value: string | null): string {
  if (!value) return "—";
  const day = value.slice(0, 10);
  return dateFormat.format(new Date(`${day}T00:00:00`)).replaceAll(" ", "-");
}

function displayLongDay(value: string): string {
  const day = value.slice(0, 10);
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(`${day}T00:00:00`));
}

function entryAmount(value: string): string {
  return formatTzsExact(value).replace(/^TZS\s*/, "");
}

function entryTypeLabel(value: string): string {
  if (value === "opening_balance") return "Opening Balance";
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

function postingWhen(value: string | null): string {
  if (!value) return "Not posted";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type DraftLine = {
  key: number;
  account: string;
  memo: string;
  debit: string;
  credit: string;
};

export default function JournalEntriesPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // URLSearchParams lags behind router.replace, so filters changed in quick
  // succession would otherwise overwrite each other. The ref is the synchronous
  // source of truth between renders.
  const paramsRef = useRef(new URLSearchParams(searchParams.toString()));

  const status = searchParams.get("status") ?? "";
  const eventCode = searchParams.get("eventCode") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const q = searchParams.get("q") ?? "";
  const parsedOffset = Number(searchParams.get("offset") ?? "0");
  const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? Math.trunc(parsedOffset) : 0;
  const entryId = searchParams.get("entry");

  const [entries, setEntries] = useState<JournalEntrySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [policies, setPolicies] = useState<PostingPolicy[]>([]);
  const [accountsBlocked, setAccountsBlocked] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  const [detail, setDetail] = useState<JournalEntryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const [composeOpen, setComposeOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(today);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeSaving, setComposeSaving] = useState<null | "draft" | "posted">(null);
  const nextKey = useRef(0);

  const [reverseTarget, setReverseTarget] = useState<JournalEntryDetail | null>(null);
  const [reverseDate, setReverseDate] = useState(today);
  const [reverseDescription, setReverseDescription] = useState("");
  const [reverseError, setReverseError] = useState<string | null>(null);
  const [reverseSaving, setReverseSaving] = useState(false);
  const [dateMode, setDateMode] = useState(searchParams.get("dateMode") ?? "between");

  const filters = useMemo(
    () => ({
      status: status || undefined,
      eventCode: eventCode || undefined,
      from: from || undefined,
      to: to || undefined,
      q: q || undefined,
      limit: pageSize,
      offset,
    }),
    [status, eventCode, from, to, q, offset, pageSize],
  );

  useEffect(() => {
    paramsRef.current = new URLSearchParams(searchParams.toString());
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    listJournalEntries(filters)
      .then((page) => {
        if (!active) return;
        setEntries(page.entries);
        setTotal(page.total);
        setLoading(false);
      })
      .catch((failure) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 403) {
          setForbidden(true);
        } else {
          setError(message(failure, "Could not load journal entries."));
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, refresh]);

  useEffect(() => {
    let active = true;
    getAccountingSettings()
      .then((settings) => {
        if (!active) return;
        setAccounts(settings.accounts.filter((account) => account.isPostable));
        setPolicies(settings.policies);
        setAccountsLoaded(true);
      })
      .catch((failure) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 403) {
          setAccountsBlocked(true);
        }
        setAccountsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!entryId) return;
    let active = true;
    getJournalEntry(entryId)
      .then((entry) => {
        if (!active) return;
        setDetail(entry);
        setDetailLoading(false);
      })
      .catch((failure) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 403) {
          setDetailError("Your role cannot view this journal entry.");
        } else {
          setDetailError(message(failure, "Could not load the journal entry."));
        }
        setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [entryId, refresh]);

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

  function setEntryParam(id: string | null) {
    const params = new URLSearchParams(paramsRef.current);
    if (id) params.set("entry", id);
    else params.delete("entry");
    paramsRef.current = new URLSearchParams(params);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const hasFilters = Boolean(status || eventCode || from || to || q);

  const eventOptions = useMemo(() => {
    const codes = new Set<string>(["MANUAL", "REVERSAL"]);
    for (const policy of policies) codes.add(policy.eventCode);
    for (const entry of entries) codes.add(entry.eventCode);
    return [...codes].sort();
  }, [policies, entries]);

  const newLine = (): DraftLine => ({
    key: nextKey.current++,
    account: "",
    memo: "",
    debit: "",
    credit: "",
  });

  function openCompose() {
    setEntryDate(today());
    setDescription("");
    setLines([newLine(), newLine()]);
    setComposeError(null);
    setComposeOpen(true);
  }

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((current) =>
      current.map((line, position) => (position === index ? { ...line, ...patch } : line)),
    );
  }

  const totals = useMemo(() => {
    let debit = 0n;
    let credit = 0n;
    let invalid = false;
    for (const line of lines) {
      const parsedDebit = parseMajorToMinor(line.debit);
      const parsedCredit = parseMajorToMinor(line.credit);
      if (parsedDebit === null || parsedCredit === null) {
        invalid = true;
        continue;
      }
      debit += parsedDebit;
      credit += parsedCredit;
    }
    const balanced =
      !invalid && (debit > 0n || credit > 0n) && debit === credit;
    return { debit, credit, invalid, balanced };
  }, [lines]);

  function composeProblem(): string | null {
    if (!entryDate) return "Choose the entry date.";
    if (!description.trim()) return "Add a narration for the entry.";
    if (lines.length < 2) return "An entry needs at least two lines.";
    for (const [index, line] of lines.entries()) {
      if (!line.account) return `Line ${index + 1}: choose a ledger account.`;
      const debit = parseMajorToMinor(line.debit);
      const credit = parseMajorToMinor(line.credit);
      if (debit === null || credit === null) {
        return `Line ${index + 1}: enter a non-negative amount with at most two decimals.`;
      }
      if ((debit === 0n) === (credit === 0n)) {
        return `Line ${index + 1}: enter exactly one of debit or credit.`;
      }
    }
    if (totals.invalid) return "Check the amounts: one line is not a valid number.";
    if (!totals.balanced) return "Debits and credits must balance before you can save.";
    return null;
  }

  async function submitCompose(post: boolean) {
    const problem = composeProblem();
    if (problem) {
      setComposeError(problem);
      return;
    }
    setComposeError(null);
    setComposeSaving(post ? "posted" : "draft");
    try {
      const created = await createJournalEntry({
        entryDate,
        description: description.trim(),
        eventCode: "MANUAL",
        post,
        lines: lines.map((line) => ({
          account: line.account,
          debit: line.debit.trim().replace(/,/g, ""),
          credit: line.credit.trim().replace(/,/g, ""),
          memo: line.memo.trim(),
        })),
      });
      setComposeOpen(false);
      setRefresh((value) => value + 1);
      setEntryParam(created.id);
      pushToast("Journal entry created.");
    } catch (failure) {
      setComposeError(message(failure, "Could not save the journal entry."));
    } finally {
      setComposeSaving(null);
    }
  }

  async function postDetail() {
    if (!detail) return;
    setPostError(null);
    setPosting(true);
    try {
      await postJournalEntry(detail.id);
      setRefresh((value) => value + 1);
      pushToast("Journal entry posted.");
    } catch (failure) {
      setPostError(message(failure, "Could not post the journal entry."));
    } finally {
      setPosting(false);
    }
  }

  function openReverse() {
    if (!detail) return;
    setReverseTarget(detail);
    setReverseDate(today());
    setReverseDescription("");
    setReverseError(null);
    setEntryParam(null);
  }

  async function submitReverse() {
    if (!reverseTarget) return;
    setReverseError(null);
    setReverseSaving(true);
    try {
      const reversal = await reverseJournalEntry(reverseTarget.id, {
        entryDate: reverseDate,
        description: reverseDescription.trim() || undefined,
      });
      setReverseTarget(null);
      setRefresh((value) => value + 1);
      setEntryParam(reversal.id);
      pushToast("Journal entry reversed.");
    } catch (failure) {
      setReverseError(message(failure, "Could not reverse the journal entry."));
    } finally {
      setReverseSaving(false);
    }
  }

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + entries.length, total);
  const difference = totals.debit > totals.credit
    ? totals.debit - totals.credit
    : totals.credit - totals.debit;
  const totalsEmpty = totals.debit === 0n && totals.credit === 0n;
  const year = new Date().getFullYear();
  const periodStart = from || `${year}-01-01`;
  const periodEnd = to || `${year}-12-31`;

  function downloadCsv() {
    const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [["Date", "Entry ID", "Details", "Entry Type", "Status", "Ledger Code", "Ledger Name", "Debit (TSh)", "Credit (TSh)"]];
    for (const entry of entries) {
      const entryLines = entry.ledgerLines ?? [];
      const lines = entryLines.length ? entryLines : [{ accountCode: "", accountName: "", debitMinor: "0", creditMinor: "0" }];
      for (const [index, line] of lines.entries()) {
        rows.push([
          index === 0 ? displayDay(entry.entryDate) : "",
          index === 0 ? entry.entryNo : "",
          index === 0 ? `${entry.sourceType} · ${entry.sourceId}${entry.description ? ` | ${entry.description}` : ""}` : "",
          index === 0 ? entryTypeLabel(entry.eventCode) : "",
          index === 0 ? entry.status === "posted" ? "Posted" : "Draft" : "",
          line.accountCode,
          line.accountName,
          line.debitMinor === "0" ? "-" : entryAmount(line.debitMinor),
          line.creditMinor === "0" ? "-" : entryAmount(line.creditMinor),
        ]);
      }
    }
    const blob = new Blob([`\uFEFF${rows.map((row) => row.map((cell) => quote(String(cell))).join(",")).join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "journal-entries.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function downloadExcel() {
    const headings = ["Date", "Entry ID", "Details", "Entry Type", "Status", "Ledger Code", "Ledger Name", "Debit (TSh)", "Credit (TSh)"];
    const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const body = entries.flatMap((entry) => {
      const entryLines = entry.ledgerLines ?? [];
      const lines = entryLines.length ? entryLines : [{ accountCode: "", accountName: "", debitMinor: "0", creditMinor: "0" }];
      return lines.map((line, index) => `<tr><td>${index === 0 ? esc(displayDay(entry.entryDate)) : ""}</td><td>${index === 0 ? esc(entry.entryNo) : ""}</td><td>${index === 0 ? esc(`${entry.sourceType} · ${entry.sourceId}${entry.description ? ` | ${entry.description}` : ""}`) : ""}</td><td>${index === 0 ? esc(entryTypeLabel(entry.eventCode)) : ""}</td><td>${index === 0 ? (entry.status === "posted" ? "Posted" : "Draft") : ""}</td><td>${esc(line.accountCode)}</td><td>${esc(line.accountName)}</td><td>${line.debitMinor === "0" ? "-" : esc(entryAmount(line.debitMinor))}</td><td>${line.creditMinor === "0" ? "-" : esc(entryAmount(line.creditMinor))}</td></tr>`);
    }).join("");
    const html = `<html><head><meta charset="utf-8"></head><body><table><thead><tr>${headings.map((heading) => `<th>${heading}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "journal-entries.xls";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="entries-page">
      <header className="flex min-h-[90px] flex-col justify-center gap-3 rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <div className="flex min-w-0 items-center gap-3">
          <BookOpen className="size-6 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="fs-title font-semibold text-heading">Entries</h1>
            <p className="mt-1 fs-text text-muted-foreground">Entries from {displayLongDay(`${year}-01-01`)} to {displayLongDay(today())}</p>
          </div>
        </div>
        <div className="entries-actions flex shrink-0 items-center gap-2">
          <button type="button" className="entries-export" onClick={() => window.print()}>
            <FileText className="size-3.5" aria-hidden="true" /> Download PDF
          </button>
          <button type="button" className="entries-export" onClick={downloadExcel}>
            <FileSpreadsheet className="size-3.5" aria-hidden="true" /> Download Excel
          </button>
          <button type="button" className="entries-export" onClick={downloadCsv}>
            <Download className="size-3.5" aria-hidden="true" /> Download CSV
          </button>
          <button type="button" onClick={() => document.getElementById("entry-from")?.focus()} className="entries-period">
            <Calendar className="size-4" aria-hidden="true" />
            <span>{displayDay(periodStart)} to {displayDay(periodEnd)}</span>
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="entries-toolbar">
        <form className="entries-search" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); setParams({ q: String(data.get("q") ?? "").trim() || null }); }}>
          <Search className="size-4" aria-hidden="true" />
          <Input key={q} name="q" defaultValue={q} placeholder="Search" aria-label="Search entries" />
          <Button type="submit" size="icon" className="sr-only" aria-label="Apply search"><Search className="size-4" aria-hidden="true" /></Button>
        </form>

        <details className="entries-filter">
          <summary><span>Date Range</span><ChevronDown className="size-3.5" /></summary>
          <form className="entries-popover" onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const first = String(data.get("date") ?? "");
            const second = String(data.get("dateEnd") ?? "");
            let nextFrom: string | null = null; let nextTo: string | null = null;
            if (dateMode === "between") { nextFrom = first || null; nextTo = second || null; }
            else if (dateMode === "on") { nextFrom = first || null; nextTo = first || null; }
            else if (dateMode === "before") nextTo = first ? new Date(new Date(`${first}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10) : null;
            else if (dateMode === "after") nextFrom = first ? new Date(new Date(`${first}T00:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10) : null;
            setParams({ from: nextFrom, to: nextTo, dateMode });
            event.currentTarget.closest("details")?.removeAttribute("open");
          }}>
            <label>Condition<select value={dateMode} onChange={(event) => setDateMode(event.target.value)}><option value="on">On</option><option value="before">Before</option><option value="after">After</option><option value="between">Between</option></select></label>
            <label>{dateMode === "before" ? "Before" : dateMode === "after" ? "After" : dateMode === "on" ? "Date" : "Start date"}<Input id="entry-from" name="date" type="date" defaultValue={from} /></label>
            {dateMode === "between" ? <label>End date<Input name="dateEnd" type="date" defaultValue={to} /></label> : null}
            <div className="entries-popover-actions"><button type="button" onClick={(event) => { setDateMode("between"); setParams({ from: null, to: null, dateMode: null }); event.currentTarget.closest("details")?.removeAttribute("open"); }}>Clear</button><button type="submit">Apply</button></div>
          </form>
        </details>

        <details className="entries-filter">
          <summary><span>Entry Type</span><ChevronDown className="size-3.5" /></summary>
          <form className="entries-popover" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); setParams({ eventCode: String(data.get("eventCode") ?? "") || null }); event.currentTarget.closest("details")?.removeAttribute("open"); }}>
            <label>Condition<select defaultValue="is" disabled><option value="is">Is</option></select></label>
            <label>Value<select name="eventCode" defaultValue={eventCode}><option value="">All types</option>{eventOptions.map((code) => <option key={code} value={code}>{entryTypeLabel(code)}</option>)}</select></label>
            <div className="entries-popover-actions"><button type="button" onClick={(event) => { setParams({ eventCode: null }); event.currentTarget.closest("details")?.removeAttribute("open"); }}>Clear</button><button type="submit">Apply</button></div>
          </form>
        </details>

        <details className="entries-filter">
          <summary><span>Status</span><ChevronDown className="size-3.5" /></summary>
          <form className="entries-popover" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); setParams({ status: String(data.get("status") ?? "") || null }); event.currentTarget.closest("details")?.removeAttribute("open"); }}>
            <label>Condition<select defaultValue="is" disabled><option value="is">Is</option></select></label>
            <label>Value<select name="status" defaultValue={status}><option value="">All statuses</option><option value="posted">Posted</option><option value="draft">Draft</option></select></label>
            <div className="entries-popover-actions"><button type="button" onClick={(event) => { setParams({ status: null }); event.currentTarget.closest("details")?.removeAttribute("open"); }}>Clear</button><button type="submit">Apply</button></div>
          </form>
        </details>

        <details className="entries-filter">
          <summary><span>Archived</span><ChevronDown className="size-3.5" /></summary>
          <div className="entries-popover entries-archive-note">AIMSCAMS journal entries do not currently have an archive status.</div>
        </details>
        <button
          type="button"
          aria-label="New entry"
          title="New manual journal entry"
          disabled={!accountsLoaded || accountsBlocked || accounts.length === 0}
          onClick={openCompose}
          className="entries-create"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
        {hasFilters ? <button className="entries-clear" type="button" onClick={() => setParams({ status: null, eventCode: null, from: null, to: null, dateMode: null, q: null })}>Clear filters</button> : null}
      </div>

      {accountsBlocked ? (
        <p className="fs-text text-muted-foreground">
          Your role can read entries but cannot list ledger accounts, so new entries are disabled.
        </p>
      ) : null}

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view journal entries. Ask an administrator for Journal Entry : View." />
      ) : loading ? (
        <PanelSkeleton rows={8} />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setRefresh((value) => value + 1)} />
      ) : (
        <section className="entries-register rounded-[var(--card-radius)] border border-card-border bg-card">
          {entries.length === 0 ? (
            <div className="p-[var(--space-16)]">
              <EmptyState
                icon={BookOpen}
                title={hasFilters ? "No entry matches" : "No journal entry yet"}
                description={
                  hasFilters
                    ? "Adjust or clear the filters to see other postings."
                    : "Record the first manual journal, or post a business event, to start the ledger."
                }
                action={
                  hasFilters ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setParams({
                          status: null,
                          eventCode: null,
                          from: null,
                          to: null,
                          q: null,
                        })
                      }
                    >
                      Clear filters
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={openCompose}
                      disabled={!accountsLoaded || accountsBlocked || accounts.length === 0}
                    >
                      New entry
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              <Table className="entries-table min-w-[1024px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[6%]">Date</TableHead>
                    <TableHead className="w-[13.16%]">Entry ID</TableHead>
                    <TableHead className="w-[15.33%]">Details</TableHead>
                    <TableHead className="w-[7.85%]">Entry Type</TableHead>
                    <TableHead className="w-[6.74%]">Status</TableHead>
                    <TableHead className="w-[6.95%]">Ledger Code</TableHead>
                    <TableHead className="w-[23.76%]">Ledger Name</TableHead>
                    <TableHead className="w-[10.12%] text-right">Debit (TSh)</TableHead>
                    <TableHead className="w-[10.12%] text-right">Credit (TSh)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, entryIndex) => {
                    const entryLines = entry.ledgerLines ?? [];
                    const lines = entryLines.length ? entryLines : [{ accountCode: "—", accountName: "—", debitMinor: "0", creditMinor: "0" }];
                    const rowSpan = lines.length;
                    return lines.map((line, index) => (
                      <TableRow key={`${entry.id}-${index}`} className={entryIndex % 2 === 0 ? "entries-striped" : ""}>
                        {index === 0 ? <TableCell rowSpan={rowSpan} className="entries-group-cell">{displayDay(entry.entryDate)}</TableCell> : null}
                        {index === 0 ? <TableCell rowSpan={rowSpan} className="entries-group-cell font-medium text-strong"><button type="button" onClick={() => setEntryParam(entry.id)} className="text-brand hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none">{entry.entryNo}</button></TableCell> : null}
                        {index === 0 ? <TableCell rowSpan={rowSpan} className="entries-group-cell"><div>{entry.sourceType} · {entry.sourceId}</div><div>{entry.description || "N/A"}</div></TableCell> : null}
                        {index === 0 ? <TableCell rowSpan={rowSpan} className="entries-group-cell">{entryTypeLabel(entry.eventCode)}</TableCell> : null}
                        {index === 0 ? <TableCell rowSpan={rowSpan} className="entries-group-cell">{entry.status === "posted" ? "Posted" : "Draft"}</TableCell> : null}
                        <TableCell>{line.accountCode ? `[${line.accountCode}]` : "—"}</TableCell>
                        <TableCell>{line.accountName || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{line.debitMinor === "0" ? "-" : entryAmount(line.debitMinor)}</TableCell>
                        <TableCell className="text-right tabular-nums">{line.creditMinor === "0" ? "-" : entryAmount(line.creditMinor)}</TableCell>
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>

              <div className="entries-pagination">
                <span>Showing {pageStart} to {pageEnd} of {total} entries</span>
                <div className="entries-page-controls">
                  <button type="button" aria-label="First Page" disabled={offset === 0} onClick={() => setParams({ offset: null })}><ChevronsLeft className="size-4" /></button>
                  <button type="button" aria-label="Previous Page" disabled={offset === 0} onClick={() => setParams({ offset: offset - pageSize <= 0 ? null : String(offset - pageSize) })}><ChevronLeft className="size-4" /></button>
                  {Array.from({ length: Math.min(5, Math.ceil(total / pageSize)) }, (_, index) => {
                    const page = index + 1;
                    const selected = Math.floor(offset / pageSize) + 1 === page;
                    return <button key={page} type="button" aria-current={selected ? "page" : undefined} onClick={() => setParams({ offset: page === 1 ? null : String((page - 1) * pageSize) })}>{page}</button>;
                  })}
                  <button type="button" aria-label="Next Page" disabled={offset + pageSize >= total} onClick={() => setParams({ offset: String(offset + pageSize) })}><ChevronRight className="size-4" /></button>
                  <button type="button" aria-label="Last Page" disabled={offset + pageSize >= total} onClick={() => setParams({ offset: String(Math.floor((total - 1) / pageSize) * pageSize) })}><ChevronsRight className="size-4" /></button>
                  <label className="entries-page-size"><span className="sr-only">Rows per page</span><select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setParams({ offset: null }); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select><ChevronDown className="size-4" aria-hidden="true" /></label>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      <Modal
        open={Boolean(entryId)}
        onClose={() => setEntryParam(null)}
        title={detail ? `Entry Details - ${detail.entryNo}` : "Entry Details"}
        size="extra-wide"
        footer={
          <>
            <Button variant="outline" onClick={() => setEntryParam(null)}>
              Close
            </Button>
            {detail?.status === "draft" ? (
              <Button onClick={() => void postDetail()} disabled={posting}>
                {posting ? "Posting…" : "Post entry"}
              </Button>
            ) : null}
            {detail?.status === "posted" && !detail.reversalOf ? (
              <Button variant="outline" onClick={openReverse} className="gap-1.5">
                <ArrowLeftRight className="size-4" aria-hidden="true" />
                Reverse entry
              </Button>
            ) : null}
          </>
        }
      >
        {detailLoading ? (
          <PanelSkeleton rows={5} />
        ) : detailError ? (
          <ErrorPanel
            message={detailError}
            onRetry={() => setRefresh((value) => value + 1)}
          />
        ) : detail ? (
          <div className="space-y-5">
            <dl className="grid gap-5 fs-text sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="mb-1 font-semibold text-body">Entry Number:</dt><dd className="text-muted-foreground">{detail.entryNo}</dd></div>
              <div><dt className="mb-1 font-semibold text-body">Date:</dt><dd className="text-muted-foreground">{displayDay(detail.entryDate)}</dd></div>
              <div><dt className="mb-1 font-semibold text-body">Entry Type:</dt><dd className="text-muted-foreground">{entryTypeLabel(detail.eventCode)}</dd></div>
              <div><dt className="mb-1 font-semibold text-body">Status:</dt><dd className="text-muted-foreground">{detail.status === "posted" ? "Posted" : "Draft"}</dd></div>
            </dl>
            {detail.reversalOf ? <Badge variant="secondary">Reversal</Badge> : null}

            {detail.reversalOf ? (
              <p className="fs-text text-muted-foreground">
                This entry reverses{" "}
                <button
                  type="button"
                  onClick={() => setEntryParam(detail.reversalOf)}
                  className="text-brand hover:underline"
                >
                  the original entry
                </button>
                .
              </p>
            ) : null}

            <h2 className="fs-text font-semibold text-heading">Ledger Entries</h2>
            <div className="space-y-2 md:hidden" aria-label="Ledger entry lines">
              {detail.lines.map((line) => (
                <article key={line.id} className="min-w-0 rounded-[var(--card-radius)] border border-card-border bg-card p-3">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words fs-text font-semibold text-strong">{line.accountName}</p>
                      <p className="mt-1 fs-caption text-muted-foreground">Code {line.accountCode}</p>
                    </div>
                    <Badge variant="secondary">{line.debitMinor === "0" ? "Cr" : "Dr"}</Badge>
                  </div>
                  <dl className="mt-3 grid min-w-0 grid-cols-2 gap-3 fs-caption">
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Debit (TSh)</dt>
                      <dd className="break-words tabular-nums text-strong">{line.debitMinor === "0" ? "—" : entryAmount(line.debitMinor)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Credit (TSh)</dt>
                      <dd className="break-words tabular-nums text-strong">{line.creditMinor === "0" ? "—" : entryAmount(line.creditMinor)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
              <dl className="grid grid-cols-2 gap-3 border-t border-row-border pt-3 fs-caption font-semibold">
                <div>
                  <dt className="text-muted-foreground">Total debit</dt>
                  <dd className="tabular-nums text-strong">{entryAmount(detail.debitMinor)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Total credit</dt>
                  <dd className="tabular-nums text-strong">{entryAmount(detail.creditMinor)}</dd>
                </div>
              </dl>
            </div>
            <div className="hidden min-w-0 md:block">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[9%]">Dr/Cr</TableHead>
                    <TableHead className="w-[11%]">Code</TableHead>
                    <TableHead>Ledger</TableHead>
                    <TableHead className="w-[24%] text-right">Debit Amount (TSh)</TableHead>
                    <TableHead className="w-[24%] text-right">Credit Amount (TSh)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="text-muted-foreground">{line.debitMinor === "0" ? "Cr" : "Dr"}</TableCell>
                      <TableCell className="text-muted-foreground">{line.accountCode}</TableCell>
                      <TableCell className="font-medium text-strong">{line.accountName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {line.debitMinor === "0" ? "-" : entryAmount(line.debitMinor)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {line.creditMinor === "0" ? "-" : entryAmount(line.creditMinor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">Total:</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      Dr {entryAmount(detail.debitMinor)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      Cr {entryAmount(detail.creditMinor)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            <div className="space-y-2 fs-text text-body">
              <p><span className="font-semibold">Narration:</span> {detail.description || "N/A"}</p>
              {detail.lines.some((line) => line.memo) ? <p><span className="font-semibold">Comment:</span> {detail.lines.find((line) => line.memo)?.memo}</p> : null}
            </div>

            <dl className="grid gap-[var(--space-8)] fs-caption text-muted-foreground sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd className="text-strong">
                  {detail.sourceType} · {detail.sourceId}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-strong">{postingWhen(detail.createdAt)}</dd>
              </div>
            </dl>

            <FormError message={postError} />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="New manual journal entry"
        size="large"
        unsaved={Boolean(description || lines.some((line) => line.debit || line.credit || line.memo))}
        footer={
          <>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => void submitCompose(false)}
              disabled={composeSaving !== null}
            >
              {composeSaving === "draft" ? "Saving…" : "Save draft"}
            </Button>
            <Button
              onClick={() => void submitCompose(true)}
              disabled={composeSaving !== null}
            >
              {composeSaving === "posted" ? "Posting…" : "Post entry"}
            </Button>
          </>
        }
      >
        <div className="space-y-[var(--space-14)]">
          <div className="grid gap-[var(--space-14)] sm:grid-cols-[180px_1fr]">
            <label className="block">
              <span className="mb-1 block fs-text font-medium text-strong">Entry date</span>
              <Input
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block fs-text font-medium text-strong">Narration</span>
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What this entry records"
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[720px] space-y-2">
              <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_110px_110px_32px] gap-2 fs-text font-medium text-muted-foreground">
                <span>Ledger account</span>
                <span>Memo</span>
                <span className="text-right">Debit</span>
                <span className="text-right">Credit</span>
                <span className="sr-only">Remove</span>
              </div>
              {lines.map((line, index) => (
                <div
                  key={line.key}
                  className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_110px_110px_32px] items-center gap-2"
                >
                  <NativeSelect
                    aria-label={`Line ${index + 1} account`}
                    value={line.account}
                    onChange={(event) => updateLine(index, { account: event.target.value })}
                  >
                    <option value="">Select account</option>
                    {accounts.map((account: GlAccount) => (
                      <option key={account.code} value={account.code}>
                        {account.code} · {account.name}
                      </option>
                    ))}
                  </NativeSelect>
                  <Input
                    aria-label={`Line ${index + 1} memo`}
                    value={line.memo}
                    onChange={(event) => updateLine(index, { memo: event.target.value })}
                    placeholder="Optional"
                  />
                  <Input
                    aria-label={`Line ${index + 1} debit`}
                    value={line.debit}
                    inputMode="decimal"
                    onChange={(event) => updateLine(index, { debit: event.target.value })}
                    placeholder="0.00"
                    className="text-right tabular-nums"
                  />
                  <Input
                    aria-label={`Line ${index + 1} credit`}
                    value={line.credit}
                    inputMode="decimal"
                    onChange={(event) => updateLine(index, { credit: event.target.value })}
                    placeholder="0.00"
                    className="text-right tabular-nums"
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove line ${index + 1}`}
                    disabled={lines.length <= 2}
                    onClick={() =>
                      setLines((current) => current.filter((_, position) => position !== index))
                    }
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLines((current) => [...current, newLine()])}
              className="gap-1.5"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add line
            </Button>

            <div className="flex flex-wrap items-center gap-[var(--space-14)] fs-text">
              <span>
                <span className="text-muted-foreground">Debits </span>
                <strong className="tabular-nums text-strong">{formatTzsExact(totals.debit)}</strong>
              </span>
              <span>
                <span className="text-muted-foreground">Credits </span>
                <strong className="tabular-nums text-strong">{formatTzsExact(totals.credit)}</strong>
              </span>
              <Badge variant={totals.balanced ? "default" : "outline"}>
                {totals.balanced
                  ? "Balanced"
                  : totals.invalid
                    ? "Check the amounts"
                    : totalsEmpty
                      ? "Enter amounts"
                      : `Difference ${formatTzsExact(difference)}`}
              </Badge>
            </div>
          </div>

          <p className="fs-text text-muted-foreground">
            Manual entries post with event code MANUAL. Each line carries one side only; the debit
            total must equal the credit total.
          </p>

          <FormError message={composeError} />
        </div>
      </Modal>

      <Modal
        open={reverseTarget !== null}
        onClose={() => setReverseTarget(null)}
        title={reverseTarget ? `Reverse entry ${reverseTarget.entryNo}` : "Reverse entry"}
        footer={
          <>
            <Button variant="outline" onClick={() => setReverseTarget(null)}>
              Cancel
            </Button>
            <Button onClick={() => void submitReverse()} disabled={reverseSaving}>
              {reverseSaving ? "Reversing…" : "Post reversal"}
            </Button>
          </>
        }
      >
        {reverseTarget ? (
          <div className="space-y-[var(--space-14)]">
            <p className="fs-text text-muted-foreground">
              The reversal is a new posted entry that swaps every debit and credit. The original
              entry stays untouched.
            </p>
            <p className="fs-text text-strong">
              {displayDay(reverseTarget.entryDate)} · {formatTzsExact(reverseTarget.debitMinor)}
            </p>
            <div className="grid gap-[var(--space-14)] sm:grid-cols-[180px_1fr]">
              <label className="block">
                <span className="mb-1 block fs-text font-medium text-strong">Reversal date</span>
                <Input
                  type="date"
                  value={reverseDate}
                  onChange={(event) => setReverseDate(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block fs-text font-medium text-strong">
                  Description (optional)
                </span>
                <Input
                  value={reverseDescription}
                  onChange={(event) => setReverseDescription(event.target.value)}
                  placeholder={`Reversal of entry ${reverseTarget.entryNo}`}
                />
              </label>
            </div>
            <FormError message={reverseError} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function NativeSelect({
  className,
  ...props
}: ComponentProps<"select">) {
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
