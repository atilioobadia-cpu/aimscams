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
  const currentPeriod = funds.period.slice(0, 3);

  const ticks: string[] = [];
  for (let tick = max; tick >= min; tick -= step) {
    ticks.push(tick.toString());
  }

  return (
    <ChartCard testId="funds-chart" title={funds.title} className="px-[30px] pt-[48px] pb-[30px]">
      <div className="relative mt-4 h-[420px]">
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
              {funds.series.map((series) => {
                const value = period === currentPeriod ? series.value : "0";
                const height = percentageOfRange(value, min, max);
                const barKey = `${period}:${series.id}`;
                const isActive = activeBar === barKey;

                return (
                  <div key={series.id} className="relative h-full w-[56px]">
                    {value !== "0" ? (
                      <button
                        type="button"
                        data-testid="funds-bar"
                        data-series={series.id}
                        data-period={period}
                        aria-label={`${series.label}, ${period} ${funds.period}: ${formatTzs(value)}`}
                        onMouseEnter={() => setActiveBar(barKey)}
                        onMouseLeave={() => setActiveBar(null)}
                        onFocus={() => setActiveBar(barKey)}
                        onBlur={() => setActiveBar(null)}
                        className={cn(
                          "absolute bottom-0 left-0 w-[56px] rounded-none outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50",
                          toneClasses[series.tone],
                          activeBar !== null && !isActive ? "opacity-70" : "opacity-100",
                        )}
                        style={{ height: `${Math.max(height, 1)}%` }}
                      >
                        {isActive ? (
                          <span
                            role="tooltip"
                            className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-md bg-strong px-3 py-1.5 fs-text font-medium text-surface shadow-sm"
                          >
                            {series.label}: {formatTzs(value)}
                          </span>
                        ) : null}
                      </button>
                    ) : null}
                    {value !== "0" ? (
                      <span
                        aria-hidden="true"
                        data-testid="funds-value-label"
                        className="pointer-events-none absolute left-0 w-full text-center fs-text font-medium leading-none text-strong"
                        style={{ bottom: `calc(${Math.max(height, 1)}% + 10px)` }}
                      >
                        {formatCompactTzs(value)}
                      </span>
                    ) : null}
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
              className={cn("h-2 w-9 shrink-0 rounded-sm", toneClasses[series.tone])}
              aria-hidden="true"
            />
            <span>{series.label}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
