"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  BookOpen,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { AccountingNav } from "@/components/accounting/accounting-nav";
import {
  ErrorPanel,
  ForbiddenPanel,
  FormError,
  PanelSkeleton,
} from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { FilterBar } from "@/components/data/filter-bar";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader
        title="Journal entries"
        description="Every posting in the general ledger, with its balanced lines and reversal trail."
        breadcrumb={
          <Link href="/accounting" className="hover:text-brand">
            Accounting
          </Link>
        }
        actions={
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
        }
      />

      <AccountingNav />

      {accountsBlocked ? (
        <p className="text-fs text-muted-foreground">
          Your role can read entries but cannot list ledger accounts, so new entries are disabled.
        </p>
      ) : null}

      <FilterBar label="Journal entry filters">
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setParams({ q: String(data.get("q") ?? "").trim() || null });
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-fs text-muted-foreground">Search</span>
            <Input
              key={q}
              name="q"
              defaultValue={q}
              placeholder="Entry number, narration or source"
              className="w-[240px]"
            />
          </label>
          <Button type="submit" size="icon" aria-label="Apply search">
            <Search className="size-4" aria-hidden="true" />
          </Button>
        </form>

        <label className="flex flex-col gap-1">
          <span className="text-fs text-muted-foreground">Status</span>
          <NativeSelect
            value={status}
            onChange={(event) => setParams({ status: event.target.value || null })}
            aria-label="Filter by status"
            className="w-[150px]"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="posted">Posted</option>
          </NativeSelect>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-fs text-muted-foreground">Event</span>
          <NativeSelect
            value={eventCode}
            onChange={(event) => setParams({ eventCode: event.target.value || null })}
            aria-label="Filter by event"
            className="w-[170px]"
          >
            <option value="">All events</option>
            {eventOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </NativeSelect>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-fs text-muted-foreground">From</span>
          <Input
            type="date"
            value={from}
            onChange={(event) => setParams({ from: event.target.value || null })}
            aria-label="Filter from date"
            className="w-[150px]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-fs text-muted-foreground">To</span>
          <Input
            type="date"
            value={to}
            onChange={(event) => setParams({ to: event.target.value || null })}
            aria-label="Filter to date"
            className="w-[150px]"
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-[var(--space-16)]">Entry</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Narration</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-[var(--space-16)] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="pl-[var(--space-16)]">
                        <button
                          type="button"
                          onClick={() => setEntryParam(entry.id)}
                          className="font-medium text-brand hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          {entry.entryNo}
                        </button>
                      </TableCell>
                      <TableCell>{displayDay(entry.entryDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.eventCode}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[360px] truncate" title={entry.description}>
                        {entry.description || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.debitMinor === "0" ? "—" : formatTzsExact(entry.debitMinor)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.creditMinor === "0" ? "—" : formatTzsExact(entry.creditMinor)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.status === "posted" ? "default" : "outline"}>
                          {entry.status === "posted" ? "Posted" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-[var(--space-16)] text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEntryParam(entry.id)}
                        >
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-chrome px-[var(--space-16)] py-[var(--space-10)] text-fs text-muted-foreground">
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
        title={detail ? `Journal entry ${detail.entryNo}` : "Journal entry"}
        size="large"
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
          <div className="space-y-[var(--space-14)]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={detail.status === "posted" ? "default" : "outline"}>
                {detail.status === "posted" ? "Posted" : "Draft"}
              </Badge>
              <Badge variant="outline">{detail.eventCode}</Badge>
              {detail.reversalOf ? <Badge variant="secondary">Reversal</Badge> : null}
              <span className="text-fs text-muted-foreground">
                {displayDay(detail.entryDate)} · {postingWhen(detail.postedAt)}
              </span>
            </div>

            <p className="text-fs text-strong">{detail.description || "No narration"}</p>

            {detail.reversalOf ? (
              <p className="text-fs text-muted-foreground">
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

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Ledger account</TableHead>
                  <TableHead>Memo</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-muted-foreground">{line.lineNo}</TableCell>
                    <TableCell>
                      <span className="font-medium text-strong">{line.accountCode}</span>{" "}
                      <span className="ml-2 text-muted-foreground">{line.accountName}</span>
                    </TableCell>
                    <TableCell>{line.memo || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.debitMinor === "0" ? "—" : formatTzsExact(line.debitMinor)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.creditMinor === "0" ? "—" : formatTzsExact(line.creditMinor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="pl-[var(--space-8)]">
                    Total
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatTzsExact(detail.debitMinor)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatTzsExact(detail.creditMinor)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>

            <dl className="grid gap-[var(--space-8)] text-fs sm:grid-cols-2">
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
              <span className="mb-1 block text-fs font-medium text-strong">Entry date</span>
              <Input
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-fs font-medium text-strong">Narration</span>
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What this entry records"
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[720px] space-y-2">
              <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_110px_110px_32px] gap-2 text-fs font-medium text-muted-foreground">
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

            <div className="flex flex-wrap items-center gap-[var(--space-14)] text-fs">
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

          <p className="text-fs text-muted-foreground">
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
            <p className="text-fs text-muted-foreground">
              The reversal is a new posted entry that swaps every debit and credit. The original
              entry stays untouched.
            </p>
            <p className="text-fs text-strong">
              {displayDay(reverseTarget.entryDate)} · {formatTzsExact(reverseTarget.debitMinor)}
            </p>
            <div className="grid gap-[var(--space-14)] sm:grid-cols-[180px_1fr]">
              <label className="block">
                <span className="mb-1 block text-fs font-medium text-strong">Reversal date</span>
                <Input
                  type="date"
                  value={reverseDate}
                  onChange={(event) => setReverseDate(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-fs font-medium text-strong">
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
        "h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-10)] text-fs text-foreground transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
