"use client";

import { BarChart3, Landmark, MapPin, Users, Wallet } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/data/empty-state";
import { FundsChart } from "@/components/dashboard/funds-chart";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { PortfolioComposition } from "@/components/dashboard/portfolio-composition";
import { UnpostedBanner } from "@/components/dashboard/unposted-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DashboardFixture } from "@/lib/fixtures/dashboard";
import { cn } from "cn";

const tabs = [
  { value: "overview", label: "Overview", icon: BarChart3 },
  { value: "members", label: "Members", icon: Users },
  { value: "loans", label: "Loans", icon: Landmark },
] as const;

type DashboardViewProps = {
  data: DashboardFixture;
};

export function DashboardTabs({ data }: DashboardViewProps) {
  const [tab, setTab] = useState<string>("overview");

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-0">
      <div
        data-testid="dashboard-tab-card"
        className="flex h-[var(--header-height)] items-center justify-between gap-6 rounded-[var(--card-radius)] border border-card-border bg-surface px-[var(--space-18)]"
      >
        <TabsList aria-label="Dashboard views" className="h-auto gap-[var(--space-24)] bg-transparent p-0">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.value;

            return (
              <TabsTrigger
                key={item.value}
                value={item.value}
                data-testid={`dashboard-tab-${item.value}`}
                className={cn(
                  "flex-none shrink-0 gap-[var(--space-8)] rounded-[var(--pill-radius)] border-0 px-0 text-[var(--font-size-body)] font-medium shadow-none transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring/50 data-active:shadow-none",
                  active ? "font-semibold" : "text-strong",
                )}
                style={{
                  width: 154,
                  height: 44,
                  backgroundColor: active ? "var(--primary)" : "transparent",
                  color: active ? "var(--text-on-primary)" : "var(--text-strong)",
                }}
              >
                <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div
          data-testid="tab-branch-context"
          className="hidden items-center gap-3 text-right xl:flex"
        >
          <MapPin className="size-5 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <p className="text-[16px] font-semibold leading-tight text-brand">{data.branch.name}</p>
            <p className="mt-1 text-[13px] leading-none text-muted-foreground">{data.asOf}</p>
          </div>
        </div>
      </div>

      <TabsContent value="overview" className="mt-5 space-y-5 outline-none">
        <UnpostedBanner unposted={data.unposted} />
        <KpiGrid kpis={data.kpis} />
        <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <FundsChart funds={data.funds} />
          <PortfolioComposition portfolio={data.portfolio} />
        </div>
      </TabsContent>

      <TabsContent value="members" className="mt-5 outline-none">
        <EmptyState
          icon={Users}
          title="Member analytics are not live yet"
          description="The Overview is backed by synthetic fixtures. Member cohorts, KYC completeness and group profiles arrive with the Client module."
        />
      </TabsContent>

      <TabsContent value="loans" className="mt-5 outline-none">
        <EmptyState
          icon={Wallet}
          title="Loan analytics are not live yet"
          description="Portfolio risk, arrears ageing and disbursement trends arrive with the Accounts and Transactions modules. The headline figures remain on Overview."
        />
      </TabsContent>
    </Tabs>
  );
}
