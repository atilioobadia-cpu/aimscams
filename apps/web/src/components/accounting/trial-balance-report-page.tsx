"use client";

import { useEffect, useState } from "react";
import { Scale } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { getTrialBalance, type TrialBalance } from "@/lib/accounting";
import { titleCase } from "@/lib/privacy";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load the trial balance.";
}

export function TrialBalanceReportPage() {
  const [data, setData] = useState<TrialBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void getTrialBalance(asOf)
        .then((next) => {
          if (cancelled) return;
          setData(next as unknown as TrialBalance);
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
  }, [asOf, reloadKey]);

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Trial balance" description="Debits and credits by account for a period." />
        <ForbiddenPanel message="Your role cannot view the trial balance. Ask an administrator for Settings Accounting : View." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Trial balance" description="Debits and credits by account for a period." breadcrumb="Accounting" />

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="as-of">As of date</label>
            <Input id="as-of" type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} className="h-[var(--control-height)]" />
          </div>
          <Button type="button" variant="outline" onClick={() => setReloadKey((value) => value + 1)}>Refresh</Button>
        </div>
      </section>

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : data ? (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Code</th>
                  <th className="whitespace-nowrap px-4 py-3">Account</th>
                  <th className="whitespace-nowrap px-4 py-3">Type</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Debit</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Credit</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.code} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{row.code}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{row.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(row.type)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(row.debitMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(row.creditMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(row.balanceMinor)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-card-border bg-subtle font-semibold">
                <tr>
                  <td className="px-4 py-3" colSpan={3}>Total</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-right">{formatTzs(data.debitMinor)}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-right">{formatTzs(data.creditMinor)}</td>
                  <td className="whitespace-nowrap px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
