"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  BookOpen,
  Calendar,
  ChevronDown,
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
import { FilterBar } from "@/components/data/filter-bar";
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

const PAGE_SIZE = 25;

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
  return dateFormat.format(new Date(`${day}T00:00:00`));
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

  const filters = useMemo(
    () => ({
      status: status || undefined,
      eventCode: eventCode || undefined,
      from: from || undefined,
      to: to || undefined,
      q: q || undefined,
      limit: PAGE_SIZE,
      offset,
    }),
    [status, eventCode, from, to, q, offset],
  );

  useEffect(() => {
    paramsRef.current = new URLSearchParams(searchParams.toString());
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setForbidden(false);
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
    if (!entryId) {
      setDetail(null);
      setDetailError(null);
      setPostError(null);
      return;
    }
    let active = true;
    setDetailLoading(true);
    setDetailError(null);
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

  return (
    <div className="space-y-4">
      <header className="flex min-h-[94px] flex-col justify-center gap-3 rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <BookOpen className="size-6 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="fs-title font-semibold text-heading">Entries</h1>
            <p className="mt-1 fs-text text-muted-foreground">Entries from {displayDay(`${year}-01-01`)} to {displayDay(today())}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => document.getElementById("entry-from")?.focus()} className="flex h-9 items-center gap-2 rounded-[var(--control-radius)] border border-primary bg-card px-3 fs-text text-primary transition-colors hover:bg-primary-tint">
            <Calendar className="size-4" aria-hidden="true" />
            <span>{displayDay(periodStart)} to {displayDay(periodEnd)}</span>
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
          <Button
            onClick={openCompose}
            disabled={!accountsLoaded || accountsBlocked || accounts.length === 0}
            className="gap-1.5"
            title={
              accountsBlocked
                ? "Requires Settings Accounting : View to list ledger accounts."
                : undefined
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            New entry
          </Button>
        </div>
      </header>

      {accountsBlocked ? (
        <p className="fs-text text-muted-foreground">
          Your role can read entries but cannot list ledger accounts, so new entries are disabled.
        </p>
      ) : null}

      <FilterBar label="Entry filters" className="gap-2 rounded-[var(--card-radius)] p-3">
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setParams({ q: String(data.get("q") ?? "").trim() || null });
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="sr-only">Search</span>
            <Input
              key={q}
              name="q"
              defaultValue={q}
              placeholder="Search"
              className="w-[160px]"
            />
          </label>
          <Button type="submit" size="icon" className="size-9" aria-label="Apply search">
            <Search className="size-4" aria-hidden="true" />
          </Button>
        </form>

        <label className="flex flex-col gap-1">
          <span className="sr-only">Status</span>
          <NativeSelect
            value={status}
            onChange={(event) => setParams({ status: event.target.value || null })}
            aria-label="Filter by status"
            className="!w-[120px] !min-w-0"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="posted">Posted</option>
          </NativeSelect>
        </label>

        <label className="flex flex-col gap-1">
          <span className="sr-only">Entry type</span>
          <NativeSelect
            value={eventCode}
            onChange={(event) => setParams({ eventCode: event.target.value || null })}
            aria-label="Filter by entry type"
            className="!w-[125px] !min-w-0"
          >
            <option value="">All types</option>
            {eventOptions.map((code) => (
              <option key={code} value={code}>
                {entryTypeLabel(code)}
              </option>
            ))}
          </NativeSelect>
        </label>

        <label className="flex min-w-0 flex-col gap-1">
          <span className="sr-only">From</span>
          <Input
            id="entry-from"
            type="date"
            value={from}
            onChange={(event) => setParams({ from: event.target.value || null })}
            aria-label="Filter from date"
            className="!w-[130px] !min-w-0"
          />
        </label>

        <label className="flex min-w-0 flex-col gap-1">
          <span className="sr-only">To</span>
          <Input
            type="date"
            value={to}
            onChange={(event) => setParams({ to: event.target.value || null })}
            aria-label="Filter to date"
            className="!w-[130px] !min-w-0"
          />
        </label>

        {hasFilters ? (
          <Button
            variant="ghost"
            onClick={() =>
              setParams({ status: null, eventCode: null, from: null, to: null, q: null })
            }
          >
            Clear filters
          </Button>
        ) : null}

      </FilterBar>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view journal entries. Ask an administrator for Journal Entry : View." />
      ) : loading ? (
        <PanelSkeleton rows={8} />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setRefresh((value) => value + 1)} />
      ) : (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-card">
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
              <div className="overflow-x-auto">
              <Table className="min-w-[960px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[12%] pl-[var(--space-16)]">Date</TableHead>
                    <TableHead className="w-[15%]">Entry ID</TableHead>
                    <TableHead className="w-[14%]">Entry Type</TableHead>
                    <TableHead className="w-[10%]">Status</TableHead>
                    <TableHead className="w-[21%]">Details</TableHead>
                    <TableHead className="w-[14%] text-right">Debit (TSh)</TableHead>
                    <TableHead className="w-[14%] pr-[var(--space-16)] text-right">Credit (TSh)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="pl-[var(--space-16)]">{displayDay(entry.entryDate)}</TableCell>
                      <TableCell className="font-medium text-strong">
                        <button
                          type="button"
                          onClick={() => setEntryParam(entry.id)}
                          className="text-brand hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          {entry.entryNo}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entryTypeLabel(entry.eventCode)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.status === "posted" ? "default" : "outline"}>
                          {entry.status === "posted" ? "Posted" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[360px] truncate" title={entry.description}>
                        {entry.description || "N/A"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.debitMinor === "0" ? "-" : entryAmount(entry.debitMinor)}
                      </TableCell>
                      <TableCell className="pr-[var(--space-16)] text-right tabular-nums">
                        {entry.creditMinor === "0" ? "-" : entryAmount(entry.creditMinor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-chrome px-[var(--space-16)] py-[var(--space-10)] fs-text text-muted-foreground">
                <span>
                  Showing {pageStart}–{pageEnd} of {total}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={offset === 0}
                    onClick={() =>
                      setParams({ offset: offset - PAGE_SIZE <= 0 ? null : String(offset - PAGE_SIZE) })
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={offset + PAGE_SIZE >= total}
                    onClick={() => setParams({ offset: String(offset + PAGE_SIZE) })}
                  >
                    Next
                  </Button>
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
            <Table>
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
