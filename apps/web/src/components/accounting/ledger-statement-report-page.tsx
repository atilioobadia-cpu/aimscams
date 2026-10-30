"use client";

import { useEffect, useState } from "react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiRequest } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { getLedger, type LedgerPage } from "@/lib/accounting";

function failureMessage(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export function LedgerStatementReportPage() {
  const [accounts, setAccounts] = useState<{ id: string; code: string; name: string }[]>([]);
  const [accountId, setAccountId] = useState("");
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<LedgerPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void apiRequest<{ id: string; code: string; name: string }[]>("/accounting/chart-of-accounts")
      .then((next) => { if (cancelled) return; setAccounts(next); })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!accountId) { setData(null); return; }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void getLedger({ accountId, from, to, limit: 200 })
        .then((next) => { if (cancelled) return; setData(next); setForbidden(false); })
        .catch((failure: unknown) => {
          if (cancelled) return;
          if (failure instanceof ApiError && failure.status === 403) { setForbidden(true); setData(null); }
          else setError(failureMessage(failure, "Could not load the ledger statement."));
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [accountId, from, to, reloadKey]);

  if (forbidden) return (<div className="space-y-5"><PageHeader title="Ledger statement" description="Ledger statement for an account." /><ForbiddenPanel message="Your role cannot view financial reports. Ask an administrator for Settings Accounting : View." /></div>);

  return (
    <div className="space-y-5">
      <PageHeader title="Ledger statement" description="Ledger statement for an account and date range." breadcrumb="Accounting" />

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="account">Account</label>
            <select id="account" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-[var(--control-height)] w-64 rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text">
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.code} {a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="from">From</label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="to">To</label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-[var(--control-height)]" />
          </div>
          <Button type="button" variant="outline" onClick={() => setReloadKey((v) => v + 1)}>Refresh</Button>
        </div>
      </section>

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((v) => v + 1)} /> : null}

      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface"><PanelSkeleton rows={8} /></section>
      ) : data ? (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <div className="border-b border-card-border px-[var(--space-16)] py-[var(--space-10)] fs-text text-muted-foreground">
            {data.account ? `${data.account.code} ${data.account.name}` : "Account"} · Opening {formatTzs(data.openingMinor)} · Closing {formatTzs(data.closingMinor)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Date</th>
                  <th className="whitespace-nowrap px-4 py-3">Number</th>
                  <th className="whitespace-nowrap px-4 py-3">Type</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Debit</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Credit</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(row.entryDate).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{row.entryNo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{row.eventCode}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(row.debitMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(row.creditMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(row.runningMinor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-card-border px-[var(--space-16)] py-[var(--space-8)] fs-text text-muted-foreground">
            {data.total} entries
          </div>
        </section>
      ) : accountId ? null : (
        <EmptyState icon={FileText} title="Select an account" description="Choose an account and date range to view its ledger statement." />
      )}
    </div>
  );
}
