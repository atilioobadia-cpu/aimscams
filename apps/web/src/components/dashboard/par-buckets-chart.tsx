"use client";

import { ChartCard } from "@/components/data/chart-card";
import { formatCompactTzs } from "@/lib/format";
import { cn } from "cn";

const toneClasses = {
  current: "bg-brand",
  "1-30": "bg-accent-yellow",
  "31-90": "bg-chart-bar",
  "90+": "bg-[#5d1a1a]",
} as const;

function percentageOfRange(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

const categories = [
  { id: "current", label: "Current", value: 5000000000, tone: "current" as const },
  { id: "1-30", label: "1-30 Days", value: 1379000000, tone: "1-30" as const },
  { id: "31-90", label: "31-90 Days", value: 2529000000, tone: "31-90" as const },
  { id: "90+", label: "90+ Days", value: 464000000, tone: "90+" as const },
];

const MAX_VALUE = 5000000000;

export function ParBucketsChart() {
  return (
    <ChartCard
      testId="par-buckets-chart"
      title="Risk Snapshot: PAR Buckets"
      className="px-[30px] pt-[48px] pb-[30px]"
    >
      <div className="relative mt-7 h-[420px]">
        <div className="absolute bottom-0 left-[80px] right-0 top-8">
          {[50, 40, 30, 20, 10, 0].map((tick) => (
            <div
              key={tick}
              data-testid="par-gridline"
              className="absolute inset-x-0 border-t border-grid-line"
              style={{ bottom: `${percentageOfRange(tick * 1e6, MAX_VALUE)}%` }}
            >
              <span
                data-testid="par-axis-tick"
                className="absolute -left-[76px] w-[72px] -translate-y-1/2 text-right fs-text leading-none text-axis"
              >
                TZS {tick}M
              </span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-[80px] right-0 top-8 flex items-end justify-center gap-12">
          {categories.map((category) => {
            const height = percentageOfRange(category.value, MAX_VALUE);
            return (
              <div key={category.id} className="relative h-full w-[64px]">
                <button
                  type="button"
                  data-testid="par-bar"
                  data-series={category.id}
                  aria-label={`${category.label}: TZS ${formatCompactTzs(String(category.value))}`}
                  className={cn(
                    "absolute bottom-0 left-0 w-[64px] rounded-none outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50",
                    toneClasses[category.tone as keyof typeof toneClasses],
                    "opacity-100",
                  )}
                  style={{ height: `${Math.max(height, 1)}%` }}
                >
                  <span
                    aria-hidden="true"
                    data-testid="par-value-label"
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

      <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 border-t border-card-border pt-5">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center gap-2.5 fs-text text-body">
            <span
              className={cn("size-3 shrink-0 rounded-sm", toneClasses[category.tone as keyof typeof toneClasses])}
              aria-hidden="true"
            />
            <span>{category.label}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
