import {
  Banknote,
  Clock3,
  PiggyBank,
  ShieldAlert,
  TriangleAlert,
  UserMinus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "cn";
import type { KpiAccent, KpiFixture, KpiIcon } from "@/lib/fixtures/dashboard";
import { formatInteger, formatTzs } from "@/lib/format";

const kpiIcons: Record<KpiIcon, LucideIcon> = {
  members: Users,
  principal: Wallet,
  "arrears-principal": TriangleAlert,
  "arrears-clients": UserMinus,
  "portfolio-risk": ShieldAlert,
  savings: PiggyBank,
  till: Banknote,
  unposted: Clock3,
};

const accentClasses: Record<KpiAccent, string> = {
  teal: "border-accent-teal/30 bg-accent-teal-bg text-accent-teal",
  red: "border-accent-red/30 bg-accent-red-bg text-accent-red",
  yellow: "border-accent-yellow/40 bg-accent-yellow-bg text-accent-yellow",
};

function displayValue(kpi: KpiFixture): string {
  switch (kpi.format) {
    case "money":
      return formatTzs(kpi.value);
    case "integer":
      return formatInteger(kpi.value);
    case "percent":
      return `${kpi.value}%`;
    default:
      return kpi.value;
  }
}

export function StatCard({ kpi, className }: { kpi: KpiFixture; className?: string }) {
  const Icon = kpiIcons[kpi.icon];

  return (
    <article
      data-testid="kpi-card"
      data-kpi-id={kpi.id}
      className={cn(
        "relative flex min-h-[185px] flex-col justify-between rounded-xl border border-card-border bg-surface p-[30px]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="max-w-[180px] text-[18px] font-medium leading-6 text-label">{kpi.label}</h3>
        <span
          className={cn(
            "grid size-[66px] shrink-0 place-items-center rounded-full border",
            accentClasses[kpi.accent],
          )}
          data-testid="kpi-badge"
        >
          <Icon className="size-7" strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>

      <div>
        <p className="text-[30px] font-bold leading-none tracking-tight text-strong">
          {displayValue(kpi)}
        </p>
        {kpi.hint ? (
          <p className="mt-2 text-sm leading-5 text-muted-foreground">{kpi.hint}</p>
        ) : null}
      </div>
    </article>
  );
}
