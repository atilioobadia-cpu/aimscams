"use client";

import { useEffect, useState } from "react";
import { Clock3, Search } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { titleCase } from "@/lib/privacy";
import { listTillSessions, type TillSessionList, type TillSessionSummary } from "@/lib/transactions";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load teller history.";
}

export function TellerHistoryPage() {
  const [data, setData] = useState<TillSessionList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listTillSessions({ from: from || undefined, to: to || undefined })
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
  }, [from, to, reloadKey]);

  const items = data?.items ?? [];
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const paged = items.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Teller history"
        description="Per-teller till sessions and transaction counts."
      />

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="history-from">From date</label>
            <Input id="history-from" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="history-to">To date</label>
            <Input id="history-to" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="h-[var(--control-height)]" />
          </div>
        </div>
      </section>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view teller history. Ask an administrator for Transaction : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={6} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState icon={Clock3} title="No till sessions yet" description="Opened till sessions will appear here." />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Business date</th>
                  <th className="whitespace-nowrap px-4 py-3">Teller</th>
                  <th className="whitespace-nowrap px-4 py-3">Branch</th>
                  <th className="whitespace-nowrap px-4 py-3">Opening float</th>
                  <th className="whitespace-nowrap px-4 py-3">System balance</th>
                  <th className="whitespace-nowrap px-4 py-3">Variance</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                  <th className="whitespace-nowrap px-4 py-3">Transactions</th>
                  <th className="whitespace-nowrap px-4 py-3">Opened at</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((item: TillSessionSummary) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.businessDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.tellerName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.branchName}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(item.openingFloatMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{item.systemBalanceMinor ? formatTzs(item.systemBalanceMinor) : "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{item.varianceMinor ? formatTzs(item.varianceMinor) : "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={item.status === "OPEN" ? "default" : "outline"}>{titleCase(item.status)}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{item.transactionCount}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(item.openedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border px-4 py-3 fs-text text-muted-foreground">
            <span>{items.length} sessions</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <span>Page {page} of {pageCount}</span>
              <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
