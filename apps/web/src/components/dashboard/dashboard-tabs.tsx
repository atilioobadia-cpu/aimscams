"use client";

import { BarChart3, Landmark, MapPin, Users, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/data/empty-state";
import { FundsChart } from "@/components/dashboard/funds-chart";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { PortfolioComposition } from "@/components/dashboard/portfolio-composition";
import { UnpostedBanner } from "@/components/dashboard/unposted-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DashboardFixture } from "@/lib/fixtures/dashboard";
import { listClients } from "@/lib/settings";
import { listLoans } from "@/lib/settings";
import { formatTzs } from "@/lib/format";
import { titleCase } from "@/lib/privacy";
import { cn } from "cn";

const tabs = [
  { value: "overview", label: "Overview", icon: BarChart3 },
  { value: "members", label: "Members", icon: Users },
  { value: "loans", label: "Loans", icon: Landmark },
] as const;

type DashboardViewProps = {
  data: DashboardFixture;
};

type ClientItem = { id: string; clientType: string; status: string; fullName: string; referenceNo: string; nationalId: string | null };
type LoanItem = { id: string; status: string; principalMinor: string; outstandingPrincipalMinor: string; loanNumber: string; clientName: string | null };

export function DashboardTabs({ data }: DashboardViewProps) {
  const [tab, setTab] = useState<string>("overview");
  const [clients, setClients] = useState<ClientItem[] | null>(null);
  const [loans, setLoans] = useState<LoanItem[] | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingLoans, setLoadingLoans] = useState(false);

  useEffect(() => {
    if (tab !== "members" || clients !== null) return;
    let cancelled = false;
    setLoadingMembers(true);
    void listClients()
      .then((res) => {
        if (cancelled) return;
        setClients(res.items as ClientItem[]);
      })
      .catch(() => {
        if (!cancelled) setClients([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMembers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, clients]);

  useEffect(() => {
    if (tab !== "loans" || loans !== null) return;
    let cancelled = false;
    setLoadingLoans(true);
    void listLoans({})
      .then((res) => {
        if (cancelled) return;
        setLoans(res.items as LoanItem[]);
      })
      .catch(() => {
        if (!cancelled) setLoans([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingLoans(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, loans]);

  const memberCount = clients?.length ?? 0;
  const individualCount = clients?.filter((c) => c.clientType === "INDIVIDUAL").length ?? 0;
  const groupCount = clients?.filter((c) => c.clientType === "GROUP").length ?? 0;
  const kycComplete = clients?.filter((c) => c.nationalId).length ?? 0;

  const loanCount = loans?.length ?? 0;
  const activeLoans = loans?.filter((l) => l.status === "ACTIVE" || l.status === "DISBURSED").length ?? 0;
  const totalOutstanding = loans?.reduce((s, l) => s + BigInt(l.outstandingPrincipalMinor || "0"), 0n) ?? 0n;
  const totalPrincipal = loans?.reduce((s, l) => s + BigInt(l.principalMinor || "0"), 0n) ?? 0n;

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-0">
      <div
        data-testid="dashboard-tab-card"
        className="flex h-[54px] items-center justify-between gap-4 rounded-[var(--card-radius)] border border-card-border bg-surface px-[var(--space-14)]"
      >
        <TabsList aria-label="Dashboard views" className="h-auto gap-[var(--space-6)] bg-transparent p-0">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.value;

            return (
              <TabsTrigger
                key={item.value}
                value={item.value}
                data-testid={`dashboard-tab-${item.value}`}
                className={cn(
                  "flex-none shrink-0 gap-[var(--space-8)] rounded-[var(--pill-radius)] border-0 px-0 fs-text font-medium shadow-none transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring/50 data-active:shadow-none",
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
            <p className="fs-text font-semibold leading-tight text-brand">{data.branch.name}</p>
            <p className="mt-1 fs-text leading-none text-muted-foreground">{data.asOf}</p>
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

      <TabsContent value="members" className="mt-5 space-y-4 outline-none">
        {loadingMembers ? (
          <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-14)]">
            <p className="fs-text text-muted-foreground">Loading member analytics...</p>
          </div>
        ) : clients && clients.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-14)]">
                <p className="fs-text text-muted-foreground">Total members</p>
                <p className="mt-1 fs-text font-bold text-strong">{memberCount}</p>
              </div>
              <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-14)]">
                <p className="fs-text text-muted-foreground">Individuals</p>
                <p className="mt-1 fs-text font-bold text-strong">{individualCount}</p>
              </div>
              <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-14)]">
                <p className="fs-text text-muted-foreground">Groups</p>
                <p className="mt-1 fs-text font-bold text-strong">{groupCount}</p>
              </div>
              <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-14)]">
                <p className="fs-text text-muted-foreground">KYC complete</p>
                <p className="mt-1 fs-text font-bold text-strong">{kycComplete}</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left fs-text">
                  <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3">Reference</th>
                      <th className="whitespace-nowrap px-4 py-3">Name</th>
                      <th className="whitespace-nowrap px-4 py-3">Type</th>
                      <th className="whitespace-nowrap px-4 py-3">Status</th>
                      <th className="whitespace-nowrap px-4 py-3">KYC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.slice(0, 10).map((client) => (
                      <tr key={client.id} className="border-b border-card-border last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{client.referenceNo}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-body">{client.fullName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(client.clientType)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(client.status)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-body">{client.nationalId ? "Complete" : "Pending"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <EmptyState icon={Users} title="No members yet" description="Member analytics will appear once clients are registered." />
        )}
      </TabsContent>

      <TabsContent value="loans" className="mt-5 space-y-4 outline-none">
        {loadingLoans ? (
          <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-14)]">
            <p className="fs-text text-muted-foreground">Loading loan analytics...</p>
          </div>
        ) : loans && loans.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-14)]">
                <p className="fs-text text-muted-foreground">Total loans</p>
                <p className="mt-1 fs-text font-bold text-strong">{loanCount}</p>
              </div>
              <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-14)]">
                <p className="fs-text text-muted-foreground">Active/disbursed</p>
                <p className="mt-1 fs-text font-bold text-strong">{activeLoans}</p>
              </div>
              <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-14)]">
                <p className="fs-text text-muted-foreground">Total principal</p>
                <p className="mt-1 fs-text font-bold text-strong">{formatTzs(totalPrincipal.toString())}</p>
              </div>
              <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-14)]">
                <p className="fs-text text-muted-foreground">Outstanding</p>
                <p className="mt-1 fs-text font-bold text-strong">{formatTzs(totalOutstanding.toString())}</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left fs-text">
                  <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3">Loan number</th>
                      <th className="whitespace-nowrap px-4 py-3">Client</th>
                      <th className="whitespace-nowrap px-4 py-3">Principal</th>
                      <th className="whitespace-nowrap px-4 py-3">Outstanding</th>
                      <th className="whitespace-nowrap px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.slice(0, 10).map((loan) => (
                      <tr key={loan.id} className="border-b border-card-border last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{loan.loanNumber}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-body">{loan.clientName ?? "N/A"}</td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(loan.principalMinor)}</td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(loan.outstandingPrincipalMinor)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(loan.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <EmptyState icon={Wallet} title="No loans yet" description="Loan analytics will appear once loans are created." />
        )}
      </TabsContent>
    </Tabs>
  );
}
