"use client";

import { useState } from "react";

import { ChartCard } from "@/components/data/chart-card";
import { formatCompactTzs, formatTzs } from "@/lib/format";
import { cn } from "cn";

const toneClasses = {
  current: "bg-brand",
  "1-30": "bg-accent-yellow",
  "31-90": "bg-chart-bar",
  "90+": "bg-chart-bar-dark",
} as const;

type ParBucket = {
  id: string;
  label: string;
  value: string;
  tone: "current" | "1-30" | "31-90" | "90+";
};

type ParBucketsChartProps = {
  buckets: ParBucket[];
};

export function ParBucketsChart({ buckets }: ParBucketsChartProps) {
  const categories = buckets;
  const MAX_VALUE = Math.max(...categories.map((c) => Number(c.value)), 1);
  const [activeBar, setActiveBar] = useState<string | null>(null);

  const ticks = [50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0].map((value) => value * 100000000);

  return (
    <ChartCard testId="par-buckets-chart" title="Risk Snapshot: PAR Buckets">
      <div className="relative mt-4 h-[300px]">
        <div className="absolute bottom-8 left-[100px] right-0 top-8">
          {ticks.map((tick) => (
            <div
              key={tick}
              data-testid="par-gridline"
              className="absolute inset-x-0 border-t border-grid-line"
              style={{ bottom: `${(tick / MAX_VALUE) * 100}%` }}
            >
              <span
                data-testid="par-axis-tick"
                className="absolute -left-[96px] w-[88px] -translate-y-1/2 text-right fs-text leading-none text-axis"
              >
                {tick === 0 ? "TZS 0" : `TZS ${tick / 100000000}M`}
              </span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-8 left-[100px] right-0 top-8 flex items-end justify-around">
          {categories.map((category) => {
            const height = (Number(category.value) / MAX_VALUE) * 100;
            const isActive = activeBar === category.id;
            return (
              <div key={category.id} className="relative h-full w-[65.333px]">
                <button
                  type="button"
                  data-testid="par-bar"
                  data-series={category.id}
                  aria-label={`${category.label}, ${category.label}: ${formatTzs(category.value)}`}
                  onMouseEnter={() => setActiveBar(category.id)}
                  onMouseLeave={() => setActiveBar(null)}
                  onFocus={() => setActiveBar(category.id)}
                  onBlur={() => setActiveBar(null)}
                  className={cn(
                    "absolute bottom-0 left-0 w-[65.333px] rounded-none outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50",
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
                      {category.label}: {formatTzs(category.value)}
                    </span>
                  ) : null}
                  <span
                    aria-hidden="true"
                    data-testid="par-value-label"
                    className="pointer-events-none absolute left-0 w-full text-center fs-text font-medium leading-none text-strong"
                    style={{ bottom: `calc(${Math.max(height, 1)}% + 10px)` }}
                  >
                    {formatCompactTzs(category.value)}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-0 left-[100px] right-0 flex h-6 items-center justify-around text-center fs-text text-axis">
          {categories.map((category) => (
            <span key={category.id} data-testid="par-category">
              {category.label}
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap items-center justify-center gap-4 border-t border-card-border pt-4">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center gap-2 fs-text text-body">
            <span
              className={cn("h-[16px] w-[40px] shrink-0", toneClasses[category.tone])}
              aria-hidden="true"
              style={{ transform: "scaleY(0.6666666666666666)" }}
            />
            <span>{category.id === "current" ? "Current" : category.id === "1-30" ? "Early arrears" : category.id === "31-90" ? "Mid arrears" : "Late arrears"}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
