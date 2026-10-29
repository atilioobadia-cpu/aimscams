"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

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
  return "Could not load the financial position.";
}

export function FinancialPositionReportPage() {
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
  }, [asOf, reloadKey]);

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Financial position" description="Assets, liabilities and equity at a point in time." />
        <ForbiddenPanel message="Your role cannot view financial reports. Ask an administrator for Settings Accounting : View." />
      </div>
    );
  }

  const assets = data?.rows.filter((r) => r.type === "asset") ?? [];
  const liabilities = data?.rows.filter((r) => r.type === "liability") ?? [];
  const equity = data?.rows.filter((r) => r.type === "equity") ?? [];
  const totalAssets = assets.reduce((s, r) => s + BigInt(r.balanceMinor || "0"), 0n);
  const totalLiabilities = liabilities.reduce((s, r) => s + BigInt(r.balanceMinor || "0"), 0n);
  const totalEquity = equity.reduce((s, r) => s + BigInt(r.balanceMinor || "0"), 0n);

  function renderSection(title: string, rows: typeof assets) {
    return (
      <>
        <tr className="bg-subtle">
          <td className="px-4 py-2 font-semibold text-strong" colSpan={3}>{title}</td>
        </tr>
        {rows.map((row) => (
          <tr key={row.code} className="border-b border-card-border last:border-0">
            <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{row.code}</td>
            <td className="whitespace-nowrap px-4 py-3 text-body">{row.name}</td>
            <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(row.balanceMinor)}</td>
          </tr>
        ))}
      </>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Financial position" description="Assets, liabilities and equity at a point in time." breadcrumb="Accounting" />

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
            <table className="w-full min-w-[600px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Code</th>
                  <th className="whitespace-nowrap px-4 py-3">Account</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {renderSection("Assets", assets)}
                <tr className="border-t border-card-border font-semibold">
                  <td className="px-4 py-3" colSpan={2}>Total assets</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-right">{formatTzs(totalAssets.toString())}</td>
                </tr>
                {renderSection("Liabilities", liabilities)}
                <tr className="border-t border-card-border font-semibold">
                  <td className="px-4 py-3" colSpan={2}>Total liabilities</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-right">{formatTzs(totalLiabilities.toString())}</td>
                </tr>
                {renderSection("Equity", equity)}
                <tr className="border-t border-card-border font-semibold">
                  <td className="px-4 py-3" colSpan={2}>Total equity</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-right">{formatTzs(totalEquity.toString())}</td>
                </tr>
                <tr className="border-t-2 border-card-border font-bold">
                  <td className="px-4 py-3" colSpan={2}>Liabilities + equity</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-right">{formatTzs((totalLiabilities + totalEquity).toString())}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
