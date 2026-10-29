"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { getAccountingSettings, getLedger } from "@/lib/accounting";
import { titleCase } from "@/lib/privacy";

type LedgerPage = Awaited<ReturnType<typeof getLedger>>;

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load the cash book.";
}

export function CashBookPage() {
  const [data, setData] = useState<LedgerPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [accountCode, setAccountCode] = useState("1002");
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void (async () => {
        const accounts = await getAccountingSettings().then((s) => s.accounts);
        const account = accounts.find((a) => a.code === accountCode);
        if (!account) throw new Error("Account not found.");
        return getLedger({ accountId: account.id, from, to, limit: 500 });
      })()
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
  }, [accountCode, from, to, reloadKey]);

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Cash book" description="Cash receipts and payments." />
        <ForbiddenPanel message="Your role cannot view the cash book. Ask an administrator for Settings Accounting : View." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Cash book" description="Cash receipts and payments by account." breadcrumb="Accounting" />

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="account">Cash account</label>
            <select id="account" value={accountCode} onChange={(event) => setAccountCode(event.target.value)} className="h-[var(--control-height)] rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text">
              <option value="1002">1002 Cash on hand</option>
              <option value="1010">1010 Teller cash</option>
              <option value="1003">1003 Bank - CRDB</option>
              <option value="1005">1005 Bank - NMB</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="from">From</label>
            <Input id="from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="to">To</label>
            <Input id="to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-[var(--control-height)]" />
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
        <>
          <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left fs-text">
                <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3">Date</th>
                    <th className="whitespace-nowrap px-4 py-3">Entry</th>
                    <th className="whitespace-nowrap px-4 py-3">Description</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Debit</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Credit</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Running</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.lineId} className="border-b border-card-border last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-body">{row.entryDate}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{row.entryNo}</td>
                      <td className="px-4 py-3 text-body">{row.description}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(row.debitMinor)}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(row.creditMinor)}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(row.runningMinor)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-card-border bg-subtle font-semibold">
                  <tr>
                    <td className="px-4 py-3" colSpan={3}>Opening {formatTzs(data.openingMinor)} · Closing {formatTzs(data.closingMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3" />
                    <td className="whitespace-nowrap px-4 py-3" />
                    <td className="whitespace-nowrap px-4 py-3 text-right">{formatTzs(data.closingMinor)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
