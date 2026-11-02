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
  const accentText = accentClasses[kpi.accent].split(" ").find((item) => item.startsWith("text-")) ?? "text-strong";

  return (
    <article
      data-testid="kpi-card"
      data-kpi-id={kpi.id}
      className={cn(
        "relative flex min-h-[123.33px] flex-col justify-between rounded-[var(--card-radius)] border border-card-border bg-surface p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className={cn("max-w-[160px] fs-text font-normal leading-[1.3]", accentText)}>{kpi.label}</h3>
        <span
          className={cn(
            "grid size-[44px] shrink-0 place-items-center rounded-full border",
            accentClasses[kpi.accent],
          )}
          data-testid="kpi-badge"
        >
          <Icon className="size-[17.33px]" strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>

      <div>
        <p className="text-[21.33px] font-bold leading-none tracking-tight text-strong">
          {displayValue(kpi)}
        </p>
        {kpi.hint ? (
          <p className="mt-0.5 fs-text leading-[1.3] text-muted-foreground">{kpi.hint}</p>
        ) : null}
      </div>
    </article>
  );
}
