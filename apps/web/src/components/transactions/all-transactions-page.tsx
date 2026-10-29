"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, TriangleAlert } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { TransactionFilterPanel } from "@/components/transactions/transaction-filter-panel";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api";
import {
  listTransactions,
  type AccountingStatus,
  type TransactionList,
  type TransactionStatus,
} from "@/lib/transactions";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load transactions.";
}

export function AllTransactionsPage() {
  const [data, setData] = useState<TransactionList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TransactionStatus | "">("");
  const [accountingStatus, setAccountingStatus] = useState<AccountingStatus | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listTransactions({
        q: query,
        status: status || undefined,
        accountingStatus: accountingStatus || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
      })
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
  }, [query, status, accountingStatus, from, to, page, reloadKey]);

  const items = data?.items ?? [];
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)));
  const hasFilters = Boolean(query.trim() || status || accountingStatus || from || to);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateStatus(value: TransactionStatus | "") {
    setStatus(value);
    setPage(1);
  }

  function updateAccountingStatus(value: AccountingStatus | "") {
    setAccountingStatus(value);
    setPage(1);
  }

  function updateFrom(value: string) {
    setFrom(value);
    setPage(1);
  }

  function updateTo(value: string) {
    setTo(value);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="All transactions"
        description="Review transaction activity and its operational and accounting status."
      />

      {(data?.summary.unposted ?? 0) > 0 ? (
        <section
          role="status"
          aria-label="Unposted transactions"
          className="flex flex-wrap items-center gap-3 rounded-[var(--card-radius)] border border-accent-yellow/50 bg-accent-yellow-bg px-4 py-3"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-accent-yellow/40 bg-surface text-accent-yellow">
            <TriangleAlert className="size-4" aria-hidden="true" />
          </span>
          <p className="min-w-0 flex-1 fs-text font-medium text-strong">
            {data?.summary.unposted} transactions are waiting to be posted.
            <span className="ml-2 font-normal text-muted-foreground">
              {data?.summary.pending} pending · {data?.summary.failed} failed
            </span>
          </p>
          {data?.summary.failed ? (
            <Badge variant="destructive">{data.summary.failed} posting failures</Badge>
          ) : null}
        </section>
      ) : null}

      <TransactionFilterPanel
        query={query}
        status={status}
        accountingStatus={accountingStatus}
        from={from}
        to={to}
        onQueryChange={updateQuery}
        onStatusChange={updateStatus}
        onAccountingStatusChange={updateAccountingStatus}
        onFromChange={updateFrom}
        onToChange={updateTo}
      />

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view transactions. Ask an administrator for Transaction : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ArrowDownLeft}
          title={hasFilters ? "No transactions match" : "No transactions yet"}
          description={
            hasFilters
              ? "Adjust or clear the filters to see other transactions."
              : "Posted and pending transaction activity will appear here."
          }
        />
      ) : (
        <TransactionsTable
          items={items}
          total={data?.total ?? 0}
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
