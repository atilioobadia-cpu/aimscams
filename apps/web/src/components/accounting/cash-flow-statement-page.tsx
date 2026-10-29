"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

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
  return "Could not load the cash flow statement.";
}

export function CashFlowStatementPage() {
  const [cashOnHand, setCashOnHand] = useState<LedgerPage | null>(null);
  const [tellerCash, setTellerCash] = useState<LedgerPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void (async () => {
        const accounts = await getAccountingSettings().then((settings) => settings.accounts);
        const coh = accounts.find((a) => a.code === "1002");
        const tc = accounts.find((a) => a.code === "1010");
        if (!coh || !tc) throw new Error("Cash accounts not found in chart of accounts.");
        const [cohLedger, tcLedger] = await Promise.all([
          getLedger({ accountId: coh.id, from, to, limit: 1000 }),
          getLedger({ accountId: tc.id, from, to, limit: 1000 }),
        ]);
        if (cancelled) return;
        setCashOnHand(cohLedger);
        setTellerCash(tcLedger);
        setForbidden(false);
      })().catch((failure: unknown) => {
        if (cancelled) return;
        if (failure instanceof ApiError && failure.status === 403) {
          setForbidden(true);
        } else {
          setError(failureMessage(failure));
        }
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [from, to, reloadKey]);

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Cash flow statement" description="Operating, investing and financing cash movements." />
        <ForbiddenPanel message="Your role cannot view financial reports. Ask an administrator for Settings Accounting : View." />
      </div>
    );
  }

  const cashIn = (cashOnHand?.rows ?? []).reduce((s, r) => s + BigInt(r.debitMinor || "0"), 0n) + (tellerCash?.rows ?? []).reduce((s, r) => s + BigInt(r.debitMinor || "0"), 0n);
  const cashOut = (cashOnHand?.rows ?? []).reduce((s, r) => s + BigInt(r.creditMinor || "0"), 0n) + (tellerCash?.rows ?? []).reduce((s, r) => s + BigInt(r.creditMinor || "0"), 0n);
  const net = cashIn - cashOut;

  return (
    <div className="space-y-5">
      <PageHeader title="Cash flow statement" description="Operating, investing and financing cash movements." breadcrumb="Accounting" />

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
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
          <PanelSkeleton rows={6} />
        </section>
      ) : (
        <>
          <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left fs-text">
                <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3">Summary</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-card-border">
                    <td className="px-4 py-3 text-body">Cash in (debits to cash accounts)</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(cashIn.toString())}</td>
                  </tr>
                  <tr className="border-b border-card-border">
                    <td className="px-4 py-3 text-body">Cash out (credits to cash accounts)</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(cashOut.toString())}</td>
                  </tr>
                  <tr className="border-t-2 border-card-border font-bold">
                    <td className="px-4 py-3">Net cash movement</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-right">{formatTzs(net.toString())}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="fs-text font-bold text-strong">Cash on hand movements</h2>
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
                    </tr>
                  </thead>
                  <tbody>
                    {(cashOnHand?.rows ?? []).map((row) => (
                      <tr key={row.lineId} className="border-b border-card-border last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 text-body">{row.entryDate}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{row.entryNo}</td>
                        <td className="px-4 py-3 text-body">{row.description}</td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(row.debitMinor)}</td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(row.creditMinor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        </>
      )}
    </div>
  );
}
