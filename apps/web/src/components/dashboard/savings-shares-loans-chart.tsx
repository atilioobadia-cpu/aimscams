"use client";

import { ChartCard } from "@/components/data/chart-card";
import { formatCompactTzs } from "@/lib/format";
import { cn } from "cn";

const toneClasses = {
  savings: "bg-brand",
  shares: "bg-accent-yellow",
  loans: "bg-chart-bar",
} as const;

function percentageOfRange(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

const categories = [
  { id: "savings", label: "Savings", value: 0, tone: "savings" as const },
  { id: "shares", label: "Shares", value: 0, tone: "shares" as const },
  { id: "loans", label: "Loans", value: 11533000000, tone: "loans" as const },
];

const MAX_VALUE = 12000000000;

export function SavingsSharesLoansChart() {
  return (
    <ChartCard
      testId="savings-shares-loans-chart"
      title="Total Savings, Shares & Loans"
      className="px-[30px] pt-[48px] pb-[30px]"
    >
      <div className="relative mt-7 h-[420px]">
        <div className="absolute bottom-0 left-[80px] right-0 top-8">
          {[120, 100, 80, 60, 40, 20, 0].map((tick) => (
            <div
              key={tick}
              data-testid="ssl-gridline"
              className="absolute inset-x-0 border-t border-grid-line"
              style={{ bottom: `${percentageOfRange(tick * 1e6, MAX_VALUE)}%` }}
            >
              <span
                data-testid="ssl-axis-tick"
                className="absolute -left-[76px] w-[72px] -translate-y-1/2 text-right fs-text leading-none text-axis"
              >
                TZS {tick}M
              </span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-[80px] right-0 top-8 flex items-end justify-center gap-16">
          {categories.map((category) => {
            const height = percentageOfRange(category.value, MAX_VALUE);
            return (
              <div key={category.id} className="relative h-full w-[77px]">
                <button
                  type="button"
                  data-testid="ssl-bar"
                  data-series={category.id}
                  aria-label={`${category.label}: TZS ${formatCompactTzs(String(category.value))}`}
                  className={cn(
                    "absolute bottom-0 left-0 w-[77px] rounded-none outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50",
                    toneClasses[category.tone],
                    "opacity-100",
                  )}
                  style={{ height: `${Math.max(height, 1)}%` }}
                >
                  <span
                    aria-hidden="true"
                    data-testid="ssl-value-label"
                    className="pointer-events-none absolute left-0 w-full text-center fs-text font-medium leading-none text-strong"
                    style={{ bottom: `calc(${Math.max(height, 1)}% + 10px)` }}
                  >
                    {formatCompactTzs(String(category.value))}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-card-border pt-5">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center gap-2.5 fs-text text-body">
            <span
              className={cn("size-3 shrink-0 rounded-sm", toneClasses[category.tone])}
              aria-hidden="true"
            />
            <span>{category.label}</span>
            <span className="font-semibold text-strong">{formatCompactTzs(String(category.value))}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
