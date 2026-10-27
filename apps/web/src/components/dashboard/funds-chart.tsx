"use client";

import { useState } from "react";

import { ChartCard } from "@/components/data/chart-card";
import type { DashboardFixture } from "@/lib/fixtures/dashboard";
import { formatAxisTzs, formatCompactTzs, formatTzs, subtractMinor } from "@/lib/format";
import { cn } from "cn";

const toneClasses = {
  in: "bg-brand",
  out: "bg-chart-bar",
} as const;

function percentageOfRange(value: string, min: bigint, max: bigint): number {
  const range = max - min;
  if (range <= 0n) return 0;
  const scaled = ((BigInt(value) - min) * 10_000n) / range;
  return Math.min(100, Math.max(0, Number(scaled) / 100));
}

export function FundsChart({ funds }: { funds: DashboardFixture["funds"] }) {
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const min = BigInt(funds.axis.min);
  const max = BigInt(funds.axis.max);
  const step = BigInt(funds.axis.step);

  const ticks: string[] = [];
  for (let tick = max; tick >= min; tick -= step) {
    ticks.push(tick.toString());
  }

  const fundsIn = funds.series.find((series) => series.tone === "in");
  const fundsOut = funds.series.find((series) => series.tone === "out");
  const net = fundsIn && fundsOut ? subtractMinor(fundsIn.value, fundsOut.value) : "0";

  return (
    <ChartCard
      testId="funds-chart"
      title={funds.title}
      description={`${funds.period} Â· TZS`}
      action={
        <span className="rounded-full bg-accent-teal-bg px-3 py-1.5 text-[var(--fs)] font-medium text-brand">
          Net in {formatCompactTzs(net)}
        </span>
      }
    >
      <div className="relative mt-7 h-[300px]">
        <div className="absolute bottom-0 left-[100px] right-0 top-8">
          {ticks.map((tick) => (
            <div
              key={tick}
              data-testid="funds-gridline"
              className="absolute inset-x-0 border-t border-grid-line"
              style={{ bottom: `${percentageOfRange(tick, min, max)}%` }}
            >
              <span
                data-testid="funds-axis-tick"
                className="absolute -left-[96px] w-[88px] -translate-y-1/2 text-right text-[var(--fs)] leading-none text-axis"
              >
                {formatAxisTzs(tick)}
              </span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-[100px] right-0 top-8 flex items-end justify-center gap-16 2xl:gap-24">
          {funds.series.map((series, index) => {
            const height = percentageOfRange(series.value, min, max);
            const isActive = activeBar === index;

            return (
              <div key={series.id} className="relative h-full w-[77px]">
                <button
                  type="button"
                  data-testid="funds-bar"
                  data-series={series.id}
                  aria-label={`${series.label}, ${funds.period}: ${formatTzs(series.value)}`}
                  onMouseEnter={() => setActiveBar(index)}
                  onMouseLeave={() => setActiveBar(null)}
                  onFocus={() => setActiveBar(index)}
                  onBlur={() => setActiveBar(null)}
                  className={cn(
                    "absolute bottom-0 left-0 w-[77px] rounded-none outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50",
                    toneClasses[series.tone],
                    activeBar !== null && !isActive ? "opacity-70" : "opacity-100",
                  )}
                  style={{ height: `${Math.max(height, 1)}%` }}
                >
                  {isActive ? (
                    <span
                      role="tooltip"
                      className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-md bg-strong px-3 py-1.5 text-[var(--fs)] font-medium text-surface shadow-sm"
                    >
                      {series.label}: {formatTzs(series.value)}
                    </span>
                  ) : null}
                </button>

                <span
                  aria-hidden="true"
                  data-testid="funds-value-label"
                  className="pointer-events-none absolute left-0 w-full text-center text-[var(--fs)] font-medium leading-none text-strong"
                  style={{ bottom: `calc(${Math.max(height, 1)}% + 10px)` }}
                >
                  {formatCompactTzs(series.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-card-border pt-5">
        {funds.series.map((series) => (
          <li key={series.id} className="flex items-center gap-2.5 text-[var(--fs)] text-body">
            <span
              className={cn("size-3 shrink-0 rounded-sm", toneClasses[series.tone])}
              aria-hidden="true"
            />
            <span>{series.label}</span>
            <span className="font-semibold text-strong">{formatTzs(series.value)}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

