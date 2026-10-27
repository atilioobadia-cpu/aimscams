"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Scale } from "lucide-react";

import { AccountingNav } from "@/components/accounting/accounting-nav";
import {
  ErrorPanel,
  ForbiddenPanel,
  PanelSkeleton,
} from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { FilterBar } from "@/components/data/filter-bar";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
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
  const total = page?.total ?? 0;
  const opening = page?.openingMinor ?? "0";
  const closing = page?.closingMinor ?? "0";
  const netMovement = (BigInt(closing) - BigInt(opening)).toString();
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + rows.length, total);

  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader
        title="Ledger entries"
        description="One account at a time: the opening balance, every posted movement and the running balance."
        breadcrumb={
          <Link href="/accounting" className="hover:text-brand">
            Accounting
          </Link>
        }
      />

      <AccountingNav />

      <FilterBar label="Ledger filters">
        <label className="flex flex-col gap-1">
          <span className="text-fs text-muted-foreground">Ledger account</span>
          <NativeSelect
            value={selectedAccountId}
            onChange={(event) => setParams({ accountId: event.target.value || null })}
            aria-label="Ledger account"
            className="w-[280px]"
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
          <span className="text-fs text-muted-foreground">From</span>
          <Input
            type="date"
            value={fromValue}
            onChange={(event) => setParams({ from: event.target.value || null })}
            aria-label="Ledger from date"
            className="w-[150px]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-fs text-muted-foreground">To</span>
          <Input
            type="date"
            value={toValue}
            onChange={(event) => setParams({ to: event.target.value || null })}
            aria-label="Ledger to date"
            className="w-[150px]"
          />
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
      ) : page && page.account ? (
        <>
          <section className="rounded-[var(--card-radius)] border border-card-border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-[var(--space-10)] border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
              <div className="flex min-w-0 items-center gap-2">
                <BookOpen className="size-4 shrink-0 text-brand" aria-hidden="true" />
                <h2 className="truncate text-fs font-bold text-strong">
                  {page.account.code} · {page.account.name}
                </h2>
                <Badge variant="outline">
                  {page.account.normalBalance === "debit" ? "Debit-normal" : "Credit-normal"}
                </Badge>
              </div>
              <span className="text-fs text-muted-foreground">
                {displayDay(fromValue)} — {displayDay(toValue)}
              </span>
            </header>

            <dl className="grid gap-[var(--space-10)] px-[var(--space-16)] py-[var(--space-14)] sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[6px] bg-muted/50 px-[var(--space-12)] py-[var(--space-10)]">
                <dt className="text-fs text-muted-foreground">Opening balance</dt>
                <dd className="mt-1 truncate text-fs font-bold tabular-nums text-strong" title={formatTzsExact(opening)}>
                  {formatTzsExact(opening)}
                </dd>
              </div>
              <div className="rounded-[6px] bg-muted/50 px-[var(--space-12)] py-[var(--space-10)]">
                <dt className="text-fs text-muted-foreground">Closing balance</dt>
                <dd className="mt-1 truncate text-fs font-bold tabular-nums text-strong" title={formatTzsExact(closing)}>
                  {formatTzsExact(closing)}
                </dd>
              </div>
              <div className="rounded-[6px] bg-muted/50 px-[var(--space-12)] py-[var(--space-10)]">
                <dt className="text-fs text-muted-foreground">Net movement</dt>
                <dd className="mt-1 truncate text-fs font-bold tabular-nums text-strong" title={formatTzsExact(netMovement)}>
                  {formatTzsExact(netMovement)}
                </dd>
              </div>
              <div className="rounded-[6px] bg-muted/50 px-[var(--space-12)] py-[var(--space-10)]">
                <dt className="text-fs text-muted-foreground">Posted movements</dt>
                <dd className="mt-1 text-fs font-bold tabular-nums text-strong">{total}</dd>
              </div>
            </dl>
            <p className="px-[var(--space-16)] pb-[var(--space-12)] text-fs text-muted-foreground">
              Balances show on the account&apos;s{" "}
              {page.account.normalBalance === "debit" ? "debit" : "credit"} side; debit and credit
              columns keep the posted direction.
            </p>
          </section>

          <section className="rounded-[var(--card-radius)] border border-card-border bg-card">
            {rows.length === 0 ? (
              <div className="p-[var(--space-16)]">
                <EmptyState
                  icon={BookOpen}
                  title="No movement in this range"
                  description="Nothing posted to this account between these dates. Widen the range or reset to the current year."
                  action={
                    <Button size="sm" variant="outline" onClick={() => setParams({ from: null, to: null })}>
                      Reset dates
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-[var(--space-16)]">Date</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Narration</TableHead>
                      <TableHead>Memo</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="pr-[var(--space-16)] text-right">
                        Balance
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.lineId}>
                        <TableCell className="pl-[var(--space-16)]">
                          {displayDay(row.entryDate)}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/accounting-entries?entry=${row.entryId}`}
                            className="font-medium text-brand hover:underline"
                          >
                            {row.entryNo}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate" title={row.description}>
                          {row.description || "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={row.memo}>
                          {row.memo || "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.debitMinor === "0" ? "—" : formatTzsExact(row.debitMinor)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.creditMinor === "0" ? "—" : formatTzsExact(row.creditMinor)}
                        </TableCell>
                        <TableCell className="pr-[var(--space-16)] text-right font-medium tabular-nums text-strong">
                          {formatTzsExact(row.runningMinor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={6} className="pl-[var(--space-16)]">
                        Closing balance
                      </TableCell>
                      <TableCell className="pr-[var(--space-16)] text-right tabular-nums">
                        {formatTzsExact(closing)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
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
        </>
      ) : null}
    </div>
  );
}

function NativeSelect({ className, ...props }: ComponentProps<"select">) {
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
