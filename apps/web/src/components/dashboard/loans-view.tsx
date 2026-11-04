"use client";

import { useState } from "react";

import { DashboardFilterBar, type DashboardFilterKey, type DashboardFilters } from "@/components/dashboard/dashboard-filter-bar";
import { DisbursementsByProductChart, LoanApplicationStagesChart, LoansTransactionsAmountChart } from "@/components/dashboard/loans-charts";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { StatCard } from "@/components/data/stat-card";
import type { Client, Loan } from "@/lib/settings";
import type { KpiFixture } from "@/lib/fixtures/dashboard";
import { formatTzs } from "@/lib/format";
import { cn } from "cn";

function metric(id: string, label: string, value: string, icon: KpiFixture["icon"], accent: KpiFixture["accent"] = "teal"): KpiFixture {
  return { id, label, value, format: "text", icon, accent };
}

function TablePanel({ title, columns, rows, search = false, emptyMessage = "No local records available." }: { title: string; columns: string[]; rows: string[][]; search?: boolean; emptyMessage?: string }) {
  const [query, setQuery] = useState("");
  const visibleRows = rows.filter((row) => row.join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return (
    <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
      <div className="flex min-h-[58px] flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <h2 className="fs-text font-bold text-strong">{title}</h2>
        {search ? (
          <input
            type="search"
            aria-label={`Search ${title}`}
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-8 w-[190px] rounded-[var(--control-radius)] border border-card-border bg-surface px-2.5 fs-text text-body outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        ) : null}
      </div>
      <div className="overflow-x-auto px-5 pb-5">
        <table className="dashboard-parity-table w-full min-w-[540px] text-left fs-text">
          <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
            <tr>
              {columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-3 py-2.5">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row, rowIndex) => (
                <tr key={`${title}-${rowIndex}`} className="border-b border-card-border odd:bg-surface even:bg-subtle last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`} className={`whitespace-nowrap px-3 py-2.5 text-body ${cellIndex > 0 ? "text-right" : "text-left"}`}>{cell}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-5 text-center text-muted-foreground">
                  {query ? "No matching local records." : emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function LoansView({
  loans,
  filters,
  branches,
  products,
  onFilterChange,
}: {
  loans: Loan[];
  filters: DashboardFilters;
  branches: string[];
  products: string[];
  onFilterChange: (key: DashboardFilterKey, value: string) => void;
}) {
  const disbursed = loans.filter((loan) => Boolean(loan.disbursedAt));
  const amountDisbursed = disbursed.reduce((sum, loan) => sum + BigInt(loan.principalMinor || "0"), 0n);
  const defaults = loans.filter((loan) => ["DELINQUENT", "NPA", "WRITTEN_OFF"].includes(loan.status));
  const kpis = [
    metric("loans-disbursed", "Loans Disbursed", String(disbursed.length), "principal"),
    metric("amount-disbursed", "Amount Disbursed", formatTzs(amountDisbursed.toString()), "till"),
    metric("total-defaults", "Total Defaults", String(defaults.length), "defaults", "red"),
  ];

  const productsByName = new Map<string, Loan[]>();
  for (const loan of loans) {
    const name = loan.productName ?? "Unassigned";
    productsByName.set(name, [...(productsByName.get(name) ?? []), loan]);
  }
  const productRows = [...productsByName.entries()].map(([name, rows]) => {
    const defaultCount = rows.filter((loan) => ["DELINQUENT", "NPA", "WRITTEN_OFF"].includes(loan.status)).length;
    const averageTenure = rows.length
      ? (rows.reduce((sum, loan) => sum + loan.tenureCount, 0) / rows.length).toFixed(2)
      : "—";
    return [name, String(rows.length), String(defaultCount), averageTenure];
  });
  if (productRows.length > 0) {
    const totalLoans = loans.length;
    const totalDefaults = defaults.length;
    const averagePeriod = loans.length
      ? (loans.reduce((sum, loan) => sum + loan.tenureCount, 0) / loans.length).toFixed(2)
      : "—";
    productRows.push(["Total", String(totalLoans), String(totalDefaults), averagePeriod]);
  }

  const buckets = [
    { label: "Current", match: (dpd: number) => dpd <= 0 },
    { label: "1-30 days", match: (dpd: number) => dpd > 0 && dpd <= 30 },
    { label: "30-90 days", match: (dpd: number) => dpd > 30 && dpd <= 90 },
    { label: "90+ days", match: (dpd: number) => dpd > 90 },
  ];
  const parRows = buckets.map((bucket) => {
    const rows = loans.filter((loan) => bucket.match(loan.daysPastDue));
    const exposure = rows.reduce((sum, loan) => sum + BigInt(loan.outstandingPrincipalMinor || "0"), 0n);
    const memberCount = new Set(rows.map((loan) => loan.clientReference).filter(Boolean)).size;
    return [bucket.label, String(memberCount), String(rows.length), formatTzs(exposure.toString()), "0.00%", formatTzs(exposure.toString())];
  });
  const totalExposure = loans.reduce((sum, loan) => sum + BigInt(loan.outstandingPrincipalMinor || "0"), 0n);
  parRows.push(["Total", String(new Set(loans.map((loan) => loan.clientReference).filter(Boolean)).size), String(loans.length), formatTzs(totalExposure.toString()), "—", formatTzs(totalExposure.toString())]);

  const hasDisbursed = amountDisbursed > 0n;
  const defaultedPrincipal = defaults.reduce((sum, loan) => sum + BigInt(loan.outstandingPrincipalMinor || "0"), 0n);
  const chargeOff = hasDisbursed ? `${((defaultedPrincipal * 10000n) / amountDisbursed / 100n)}%` : "—";

  return (
    <div className="mt-[20.16px] flex flex-col gap-[13.44px] pb-[26.88px]">
      <DashboardFilterBar filters={filters} branches={branches} products={products} onChange={onFilterChange} />
      <section className="grid grid-cols-1 gap-[13.44px] sm:grid-cols-3" aria-label="Loan metrics">
        {kpis.map((kpi) => <StatCard key={kpi.id} kpi={kpi} />)}
      </section>
      <div className="grid grid-cols-1 gap-[20.16px] lg:grid-cols-2">
        <DisbursementsByProductChart />
        <LoanApplicationStagesChart />
      </div>
      <LoansTransactionsAmountChart loans={loans} />
      <div className="space-y-[13.44px]">
        <TablePanel
          title="Loan Product Insights"
          columns={["Product(s)", "Number of Loans", "Number of Defaults", "Average Period"]}
          rows={productRows}
          emptyMessage="No local loan products available."
        />
        <TablePanel
          title="Loan PAR Summary"
          columns={["Bucket (DPD)", "Number of Members", "Number of Loans", "Amount at Risk", "PAR %", "Overdue Amount"]}
          rows={parRows}
        />
        <TablePanel
          title="Loan Loss Ratios"
          columns={["Ratio", "Value"]}
          rows={[
            ["Charge-off Ratio", chargeOff],
            ["Recovery Ratio", "—"],
            ["Net Charge-off Ratio", "—"],
            ["Annual Loss Rate", "—"],
          ]}
        />
        <TablePanel
          title="Loan Guarantor Exposure"
          columns={["Guarantor", "Loans Guaranteed", "Self Loans Guaranteed", "Total Exposure", "Loans In Arrears"]}
          rows={[]}
          search
          emptyMessage="No local guarantor records available."
        />
      </div>
    </div>
  );
}
