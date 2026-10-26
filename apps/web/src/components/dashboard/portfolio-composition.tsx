import { ChartCard } from "@/components/data/chart-card";
import type { DashboardFixture } from "@/lib/fixtures/dashboard";
import { formatPercent, formatTzs, sharePercent } from "@/lib/format";
import { cn } from "cn";

const toneClasses: Record<DashboardFixture["portfolio"]["segments"][number]["tone"], string> = {
  teal: "bg-brand",
  tenant: "bg-tenant",
  logo: "bg-brand-logo",
  yellow: "bg-accent-yellow",
};

export function PortfolioComposition({ portfolio }: { portfolio: DashboardFixture["portfolio"] }) {
  return (
    <ChartCard
      testId="portfolio-composition"
      title={portfolio.title}
      description="Share of the branch portfolio"
    >
      <div
        data-testid="portfolio-bar"
        role="img"
        aria-label={`Portfolio composition, total ${formatTzs(portfolio.total)}`}
        className="mt-7 flex h-5 w-full overflow-hidden rounded-md bg-subtle"
      >
        {portfolio.segments.map((segment, index) => (
          <div
            key={segment.id}
            data-testid="portfolio-segment"
            className={cn(
              "h-full",
              index === portfolio.segments.length - 1 && "flex-1",
              toneClasses[segment.tone],
            )}
            style={
              index === portfolio.segments.length - 1
                ? undefined
                : { width: `${sharePercent(segment.value, portfolio.total)}%` }
            }
          />
        ))}
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {portfolio.segments.map((segment) => (
          <li key={segment.id} className="flex min-w-0 items-start gap-3">
            <span
              className={cn("mt-1 size-3 shrink-0 rounded-sm", toneClasses[segment.tone])}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="truncate text-sm text-muted-foreground">{segment.label}</p>
              <p className="mt-0.5 text-[17px] font-semibold leading-tight text-strong">
                {formatTzs(segment.value)}
              </p>
            </div>
            <span className="ml-auto shrink-0 text-sm font-medium text-body">
              {formatPercent(sharePercent(segment.value, portfolio.total))}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-card-border pt-5">
        <span className="text-sm font-medium text-muted-foreground">Total portfolio</span>
        <span className="text-[18px] font-bold text-strong">{formatTzs(portfolio.total)}</span>
      </div>
    </ChartCard>
  );
}
