"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Inbox, Scale } from "lucide-react";

import {
  ErrorPanel,
  ForbiddenPanel,
  PanelSkeleton,
} from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { FilterBar } from "@/components/data/filter-bar";
import { PageHeader } from "@/components/data/page-header";
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
  const entryTypes = [...new Set(rows.map((row) => row.eventCode))].sort();

  return (
    <div className="space-y-4">
      <PageHeader
        variant="card"
        title="Ledger Entries"
        icon={<BookOpen className="size-6 text-primary" aria-hidden="true" />}
      />

      <FilterBar label="Ledger filters" className="gap-2 rounded-[var(--card-radius)] p-3">
        <label className="flex flex-col gap-1">
          <span className="sr-only">Ledger account</span>
          <NativeSelect
            value={selectedAccountId}
            onChange={(event) => setParams({ accountId: event.target.value || null })}
            aria-label="Ledger account"
            className="w-[220px]"
          >
            <option value="">Select an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.code} · {account.name}
              </option>
            ))}
          </NativeSelect>
        </label>

        <label className="flex flex-col gap-1">
          <span className="sr-only">From</span>
          <Input
            type="date"
            value={fromValue}
            onChange={(event) => setParams({ from: event.target.value || null })}
            aria-label="Ledger from date"
            className="w-[145px]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="sr-only">To</span>
          <Input
            type="date"
            value={toValue}
            onChange={(event) => setParams({ to: event.target.value || null })}
            aria-label="Ledger to date"
            className="w-[145px]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="sr-only">Entry type</span>
          <NativeSelect value={entryType} onChange={(event) => setEntryType(event.target.value)} aria-label="Entry type" className="w-[170px]">
            <option value="">All entry types</option>
            {entryTypes.map((type) => <option key={type} value={type}>{type.replace(/_/g, " ")}</option>)}
          </NativeSelect>
        </label>

        {fromParam || toParam ? (
          <Button variant="ghost" onClick={() => setParams({ from: null, to: null })}>
            Reset dates
          </Button>
        ) : null}
      </FilterBar>

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
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
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
                {filteredRows.length === 0 ? <TableRow><TableCell colSpan={9} className="p-0"><div className="flex min-h-[250px] flex-col items-center justify-center gap-3 text-center fs-text text-muted-foreground"><Inbox className="size-10 text-label" aria-hidden="true" /><span>No Entries Found</span><span className="text-label">No entries match your current filter criteria.</span></div></TableCell></TableRow> : filteredRows.map((row) => <TableRow key={row.lineId}>
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
        </section>
      ) : null}
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
