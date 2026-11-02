"use client";

import { useState } from "react";

import { ChartCard } from "@/components/data/chart-card";
import type { DashboardFixture } from "@/lib/fixtures/dashboard";
import { formatAxisTzs, formatCompactTzs, formatTzs } from "@/lib/format";
import { cn } from "cn";

const toneClasses = {
  in: "bg-brand",
  out: "bg-chart-bar",
} as const;

const periods = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"] as const;

function percentageOfRange(value: string, min: bigint, max: bigint): number {
  const range = max - min;
  if (range <= 0n) return 0;
  const scaled = ((BigInt(value) - min) * 10_000n) / range;
  return Math.min(100, Math.max(0, Number(scaled) / 100));
}

export function FundsChart({ funds }: { funds: DashboardFixture["funds"] }) {
  const [activeBar, setActiveBar] = useState<string | null>(null);
  const min = BigInt(funds.axis.min);
  const max = BigInt(funds.axis.max);
  const step = BigInt(funds.axis.step);

  const ticks: string[] = [];
  for (let tick = max; tick >= min; tick -= step) {
    ticks.push(tick.toString());
  }

  return (
    <ChartCard testId="funds-chart" title={funds.title} dataSource="ledger">
      <div className="relative mt-4 h-[300px]">
        <div className="absolute bottom-8 left-[100px] right-0 top-8">
          {ticks.map((tick) => (
            <div
              key={tick}
              data-testid="funds-gridline"
              className="absolute inset-x-0 border-t border-grid-line"
              style={{ bottom: `${percentageOfRange(tick, min, max)}%` }}
            >
              <span
                data-testid="funds-axis-tick"
                className="absolute -left-[96px] w-[88px] -translate-y-1/2 text-right fs-text leading-none text-axis"
              >
                {formatAxisTzs(tick)}
              </span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-8 left-[100px] right-0 top-8 grid grid-cols-6">
          {periods.map((period) => (
            <div
              key={period}
              data-testid="funds-period"
              className="flex h-full items-end justify-center gap-1"
            >
              {funds.bars
                .filter((bar) => bar.period === period)
                .map((bar) => {
                  const height = percentageOfRange(bar.value, min, max);
                  const isActive = activeBar === bar.id;

                  return (
                    <div key={bar.id} className="relative h-full w-[52px]">
                      <button
                        type="button"
                        data-testid="funds-bar"
                        data-series={bar.series}
                        data-period={bar.period}
                        aria-label={`${bar.label}, ${bar.period} ${bar.period === "Jun" ? "June" : bar.period === "Jul" ? "July" : bar.period === "Aug" ? "August" : bar.period === "Sep" ? "September" : bar.period === "Oct" ? "October" : "November"} 2026: ${formatTzs(bar.value)}`}
                        onMouseEnter={() => setActiveBar(bar.id)}
                        onMouseLeave={() => setActiveBar(null)}
                        onFocus={() => setActiveBar(bar.id)}
                        onBlur={() => setActiveBar(null)}
                        className={cn(
                          "absolute bottom-0 left-0 w-[52px] rounded-none outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50",
                          toneClasses[bar.tone],
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
                            <span data-testid="tooltip-swatch" className={cn("mr-2 inline-block h-2.5 w-2.5", toneClasses[bar.tone])} />
                            {bar.period}
                            <br />
                            {bar.label}: {formatTzs(bar.value)}
                          </span>
                        ) : null}
                      </button>
                      <span
                        aria-hidden="true"
                        data-testid="funds-value-label"
                        className="pointer-events-none absolute left-0 w-full text-center fs-text font-medium leading-none text-strong"
                        style={{ bottom: `calc(${Math.max(height, 1)}% + 10px)` }}
                      >
                        {formatCompactTzs(bar.value)}
                      </span>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-[100px] right-0 grid h-6 grid-cols-6 text-center fs-text text-axis">
          {periods.map((period) => (
            <span key={period} data-testid="funds-month-label">
              {period}
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-card-border pt-4">
        {funds.series.map((series) => (
          <li key={series.id} className="flex items-center gap-2 fs-text text-body">
            <span
              className={cn("h-[16px] w-[40px] shrink-0", toneClasses[series.tone])}
              aria-hidden="true"
              style={{ transform: "scaleY(0.6666666666666666)" }}
            />
            <span>{series.label}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
