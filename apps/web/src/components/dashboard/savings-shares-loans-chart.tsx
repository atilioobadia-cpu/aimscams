"use client";

import { useState } from "react";

import { ChartCard } from "@/components/data/chart-card";
import { formatCompactTzs, formatTzs } from "@/lib/format";
import { cn } from "cn";

const toneClasses = {
  savings: "bg-brand",
  shares: "bg-accent-yellow",
  loans: "bg-chart-bar",
} as const;

const categories = [
  { id: "savings", label: "Savings", value: "0", tone: "savings" as const },
  { id: "shares", label: "Shares", value: "0", tone: "shares" as const },
  { id: "loans", label: "Loans", value: "11532500000", tone: "loans" as const },
];

const MAX_VALUE = 12000000000;

export function SavingsSharesLoansChart() {
  const [activeBar, setActiveBar] = useState<string | null>(null);

  function percentageOfRange(value: string, max: number): number {
    const numeric = Number(value);
    if (max <= 0) return 0;
    return Math.min(100, Math.max(0, (numeric / max) * 100));
  }

  const ticks = [120, 100, 80, 60, 40, 20, 0].map((value) => value * 100000000);

  return (
    <ChartCard testId="savings-shares-loans-chart" title="Total Savings, Shares & Loans">
      <div className="relative mt-4 h-[300px]">
        <div className="absolute bottom-8 left-[100px] right-0 top-8">
          {ticks.map((tick) => (
            <div
              key={tick}
              data-testid="ssl-gridline"
              className="absolute inset-x-0 border-t border-grid-line"
              style={{ bottom: `${(tick / MAX_VALUE) * 100}%` }}
            >
              <span
                data-testid="ssl-axis-tick"
                className="absolute -left-[96px] w-[88px] -translate-y-1/2 text-right fs-text leading-none text-axis"
              >
                {tick === 0 ? "TZS 0" : `TZS ${tick / 100000000}M`}
              </span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-8 left-[100px] right-0 top-8 flex items-end justify-around">
          {categories.map((category) => {
            const height = percentageOfRange(category.value, MAX_VALUE);
            const isActive = activeBar === category.id;
            return (
              <div key={category.id} className="relative h-full w-[84.667px]">
                {Number(category.value) > 0 ? (
                  <button
                    type="button"
                    data-testid="ssl-bar"
                    data-series={category.id}
                    aria-label={`${category.label}, ${category.label}: TZS ${Number(category.value) / 100}`}
                    onMouseEnter={() => setActiveBar(category.id)}
                    onMouseLeave={() => setActiveBar(null)}
                    onFocus={() => setActiveBar(category.id)}
                    onBlur={() => setActiveBar(null)}
                    className={cn(
                      "absolute bottom-0 left-0 w-[84.667px] rounded-none outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50",
                      toneClasses[category.tone],
                      activeBar !== null && !isActive ? "opacity-70" : "opacity-100",
                    )}
                    style={{
                      height: `${Math.max(height, 1)}%`,
                      backgroundColor: isActive ? "#dc3a1a" : undefined,
                    }}
                  >
                    {isActive ? (
                      <span
                        role="tooltip"
                        className="absolute left-1/2 top-3 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-strong px-3 py-1.5 fs-text font-medium text-surface shadow-sm"
                      >
                        <span data-testid="tooltip-swatch" className={cn("mr-2 inline-block h-2.5 w-2.5", toneClasses[category.tone])} />
                        {category.label}
                        <br />
                        {category.label}: {formatTzs(category.value).replace("TZS ", "TZS ")}
                      </span>
                    ) : null}
                    <span
                      aria-hidden="true"
                      data-testid="ssl-value-label"
                      className="pointer-events-none absolute left-0 w-full text-center fs-text font-medium leading-none text-strong"
                      style={{ bottom: `calc(${Math.max(height, 1)}% + 10px)` }}
                    >
                      {Number(category.value) > 0 ? formatCompactTzs(category.value) : ""}
                    </span>
                  </button>
                ) : (
                  <div data-testid="ssl-bar" data-series={category.id} className="absolute bottom-0 left-0 w-[84.667px]">
                    <span
                      aria-hidden="true"
                      data-testid="ssl-value-label"
                      className="pointer-events-none absolute left-0 w-full text-center fs-text font-medium leading-none text-strong"
                    >
                      {""}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-0 left-[100px] right-0 flex h-6 items-center justify-around text-center fs-text text-axis">
          {categories.map((category) => (
            <span key={category.id} data-testid="ssl-category">
              {category.label}
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-card-border pt-4">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center gap-2 fs-text text-body">
            <span
              className={cn("h-[16px] w-[40px] shrink-0", toneClasses[category.tone])}
              aria-hidden="true"
              style={{ transform: "scaleY(0.6666666666666666)" }}
            />
            <span>{category.label}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
