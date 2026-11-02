"use client";

import { ChartCard } from "@/components/data/chart-card";
import { cn } from "cn";

const MONTHS = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

function EmptyPlot({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <p className="max-w-[260px] text-center fs-text text-muted-foreground">{label}</p>
    </div>
  );
}

export function DisbursementsByProductChart() {
  return (
    <ChartCard title="Disbursements by Product" className="px-5 pt-9 pb-5">
      <div className="relative mt-4 h-[260px]">
        <EmptyPlot label="No local product disbursement data is available." />
      </div>
    </ChartCard>
  );
}

export function LoanApplicationStagesChart() {
  return (
    <ChartCard title="Loan Application Stages" className="px-5 pt-9 pb-5">
      <div className="relative mt-4 h-[260px]">
        <div className="absolute inset-y-3 left-[68px] right-0 flex flex-col justify-between">
          {[0, 1].map((line) => (
            <div key={line} className="relative border-t border-grid-line">
              <span className="absolute -left-[62px] -top-2 w-[54px] text-right fs-text leading-none text-axis">{line}</span>
            </div>
          ))}
        </div>
        <EmptyPlot label="No local application-stage data is available." />
      </div>
    </ChartCard>
  );
}

export function LoansTransactionsAmountChart({ loans }: { loans: Array<{ disbursedAt?: string | null; principalMinor?: string | null }> }) {
  const disburse = new Array(12).fill(0);
  loans.forEach((loan) => {
    if (!loan.disbursedAt) return;
    const date = new Date(loan.disbursedAt);
    if (Number.isNaN(date.getTime())) return;
    const monthIndex = (date.getFullYear() - 2025) * 12 + date.getMonth() - 11;
    if (monthIndex >= 0 && monthIndex < 12) disburse[monthIndex] += Number(loan.principalMinor || 0) / 100;
  });
  const repay = new Array(12).fill(0);
  const max = Math.max(1, ...disburse, ...repay);
  const hasData = disburse.some((value) => value > 0) || repay.some((value) => value > 0);

  return (
    <ChartCard title="Loans Transactions Amount" className="px-5 pt-9 pb-5">
      <div className="relative mt-4 h-[300px]">
        <div className="absolute inset-y-3 left-[68px] right-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className="relative border-t border-grid-line">
              <span className="absolute -left-[62px] -top-2 w-[54px] text-right fs-text leading-none text-axis">{Math.round(max * (1 - line / 4)).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="absolute inset-y-3 left-[68px] right-0 flex items-end justify-between gap-1">
          {MONTHS.map((month, index) => {
            const disburseHeight = (disburse[index] / max) * 100;
            const repayHeight = (repay[index] / max) * 100;
            const total = disburse[index] + repay[index];
            return (
              <div key={month} className="relative flex h-full w-[6%] flex-col justify-end gap-0.5">
                {total > 0 ? <span className="absolute -top-5 left-1/2 -translate-x-1/2 fs-text text-strong">{Math.round(total).toLocaleString()}</span> : null}
                <div className="w-full bg-chart-bar" style={{ height: `${disburseHeight}%` }} />
                <div className="w-full bg-primary" style={{ height: `${repayHeight}%` }} />
              </div>
            );
          })}
        </div>
        {!hasData ? <EmptyPlot label="No local loan transaction data is available for this range." /> : null}
        <div className="absolute bottom-0 left-[68px] right-0 flex justify-between gap-1 fs-text text-axis">
          {MONTHS.map((label, index) => (
            <span key={`${label}-${index}`} className="min-w-0 truncate text-center">{label}</span>
          ))}
        </div>
      </div>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-card-border pt-4">
        <li className="flex items-center gap-2 fs-text text-body"><span className="size-3 bg-chart-bar" aria-hidden="true" />Disburse</li>
        <li className="flex items-center gap-2 fs-text text-body"><span className="size-3 bg-primary" aria-hidden="true" />Repayment</li>
      </ul>
    </ChartCard>
  );
}
