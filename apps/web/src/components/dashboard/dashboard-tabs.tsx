"use client";

import { BarChart3, CreditCard, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardChartPanel } from "@/components/dashboard/dashboard-chart-panel";
import { DashboardFilterBar, type DashboardFilterKey, type DashboardFilters } from "@/components/dashboard/dashboard-filter-bar";
import { FundsChart } from "@/components/dashboard/funds-chart";
import { MembersView } from "@/components/dashboard/members-view";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { LoansView } from "@/components/dashboard/loans-view";
import { ParBucketsChart } from "@/components/dashboard/par-buckets-chart";
import { SavingsSharesLoansChart } from "@/components/dashboard/savings-shares-loans-chart";
import { StatCard } from "@/components/data/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Client, Loan } from "@/lib/settings";
import type { DashboardFixture, KpiFixture } from "@/lib/fixtures/dashboard";
import { formatTzs } from "@/lib/format";
import { listClients, listLoans } from "@/lib/settings";
import { cn } from "cn";

const tabs = [
  { value: "overview", label: "Overview", icon: BarChart3 },
  { value: "members", label: "Members", icon: UsersRound },
  { value: "loans", label: "Loans", icon: CreditCard },
] as const;

const initialFilters: DashboardFilters = {
  branch: "ALL",
  gender: "ALL",
  age: "ALL",
  clientType: "ALL",
  product: "ALL",
  date: "ALL",
};

type DashboardViewProps = {
  data: DashboardFixture;
};

function profileOf(client: Client): Record<string, unknown> {
  return client.profile && typeof client.profile === "object"
    ? (client.profile as Record<string, unknown>)
    : {};
}

function genderOf(client: Client): string {
  const profile = profileOf(client);
  const raw = String(profile.gender ?? profile.sex ?? "").trim().toUpperCase();
  if (["F", "FEMALE", "WOMAN"].includes(raw)) return "FEMALE";
  if (["M", "MALE", "MAN"].includes(raw)) return "MALE";
  return "UNDEFINED";
}

function ageOf(client: Client): number | null {
  const profile = profileOf(client);
  const directAge = Number(profile.age);
  if (Number.isFinite(directAge) && directAge >= 0 && directAge < 130) return directAge;
  const birthDate = profile.dateOfBirth ?? profile.birthDate ?? profile.dob;
  if (typeof birthDate !== "string") return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

function ageBucket(client: Client): string | null {
  const age = ageOf(client);
  if (age === null) return null;
  if (age < 25) return "UNDER_25";
  if (age <= 34) return "25_34";
  if (age <= 44) return "35_44";
  if (age <= 54) return "45_54";
  return "55_PLUS";
}

function dateMatches(value: string | null | undefined, filter: string): boolean {
  if (filter === "ALL") return true;
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (filter.startsWith("ON:")) return value.slice(0, 10) === filter.slice(3);
  const today = new Date();
  if (filter === "THIS_MONTH") {
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
  }
  if (filter === "THIS_YEAR") return date.getFullYear() === today.getFullYear();
  if (filter === "LAST_90_DAYS") {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 90);
    return date >= cutoff && date <= today;
  }
  return true;
}

function memberMatches(client: Client, filters: DashboardFilters): boolean {
  if (filters.branch !== "ALL" && client.branchName !== filters.branch) return false;
  if (filters.clientType !== "ALL" && client.clientType !== filters.clientType) return false;
  if (filters.gender !== "ALL" && genderOf(client) !== filters.gender) return false;
  if (filters.age !== "ALL" && (filters.age === "UNDEFINED" ? ageOf(client) === null : ageBucket(client) !== filters.age)) return false;
  if (!dateMatches(client.joinedAt ?? client.createdAt, filters.date)) return false;
  return true;
}

function loanMatches(loan: Loan, client: Client | undefined, filters: DashboardFilters): boolean {
  if (filters.product !== "ALL" && loan.productName !== filters.product) return false;
  if (filters.branch !== "ALL" && client?.branchName !== filters.branch) return false;
  if (filters.clientType !== "ALL" && client?.clientType !== filters.clientType) return false;
  if (filters.gender !== "ALL" && (!client || genderOf(client) !== filters.gender)) return false;
  if (filters.age !== "ALL" && (!client || ageBucket(client) !== filters.age)) return false;
  return dateMatches(loan.disbursedAt ?? loan.createdAt, filters.date);
}

function metric(id: string, label: string, value: string, icon: KpiFixture["icon"], accent: KpiFixture["accent"] = "teal"): KpiFixture {
  return { id, label, value, format: "text", icon, accent };
}

function growthSeries(clients: Client[]): { labels: string[]; values: number[] } | null {
  const dates = clients
    .map((client) => client.joinedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));
  if (dates.length === 0) return null;

  const today = new Date();
  const months = Array.from({ length: 12 }, (_, index) =>
    new Date(today.getFullYear(), today.getMonth() - 11 + index, 1),
  );
  return {
    labels: months.map((month) => month.toLocaleDateString("en-US", { month: "short", year: "2-digit" })),
    values: months.map((month) => {
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
      return dates.filter((date) => date <= end).length;
    }),
  };
}

function DashboardTablePanel({
  title,
  columns,
  rows,
  emptyMessage = "No local records available.",
  search,
  minHeight,
}: {
  title: string;
  columns: string[];
  rows: string[][];
  emptyMessage?: string;
  search?: boolean;
  minHeight?: number;
}) {
  const [query, setQuery] = useState("");
  const visibleRows = rows.filter((row) => row.join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  return (
    <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface" style={minHeight ? { minHeight: `${minHeight}px` } : undefined}>
      {search ? (
        <>
          <div className="px-[20.16px] pt-[35.28px]">
            <h2 className="mb-[20.16px] text-[15.12px] font-semibold leading-[normal] text-heading">{title}</h2>
          </div>
          <div className="mb-[13.44px] px-[20.16px]">
            <input
              type="search"
              aria-label={`Search ${title}`}
              placeholder="Search guarantor name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={{ width: "268.8px", height: "34.125px", padding: "8.4px 10.08px", borderRadius: "6px", borderColor: "#ced4da" }}
              className="rounded-[6px] border border-card-border bg-surface px-[10.08px] fs-text text-body outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
        </>
      ) : (
        <div className="flex min-h-[58px] flex-wrap items-center justify-between gap-3 px-5 pt-4">
          <h2 className="fs-text font-bold text-strong">{title}</h2>
        </div>
      )}
      <div className="overflow-x-auto px-5 pb-5">
        <table className="dashboard-parity-table w-full min-w-[540px] text-left fs-text">
          <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
            <tr>
              {columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-3 py-2.5">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row, rowIndex) => (
                <tr key={`${title}-${rowIndex}`} className="border-b border-card-border odd:bg-surface even:bg-subtle last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`} className="whitespace-nowrap px-3 py-2.5 text-body">{cell}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-5 text-center text-muted-foreground">
                  {query ? "No matching local records." : emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DashboardTabs({ data }: DashboardViewProps) {
  const [tab, setTab] = useState<string>("overview");
  const [clients, setClients] = useState<Client[] | null>(null);
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);

  useEffect(() => {
    if (tab !== "members" || clients !== null) return;
    let cancelled = false;
    void listClients()
      .then((res) => {
        if (!cancelled) setClients(res.items);
      })
      .catch(() => {
        if (!cancelled) setClients([]);
      });
    return () => { cancelled = true; };
  }, [tab, clients]);

  useEffect(() => {
    if ((tab !== "members" && tab !== "loans") || loans !== null) return;
    let cancelled = false;
    void listLoans({})
      .then((res) => {
        if (!cancelled) setLoans(res.items);
      })
      .catch(() => {
        if (!cancelled) setLoans([]);
      });
    return () => { cancelled = true; };
  }, [tab, loans]);

  const branchOptions = useMemo(() => [...new Set([
    data.branch.name,
    ...(clients ?? []).map((client) => client.branchName).filter((name): name is string => Boolean(name)),
  ])], [clients, data.branch.name]);
  const productOptions = useMemo(() => [...new Set((loans ?? []).map((loan) => loan.productName).filter((name): name is string => Boolean(name)))], [loans]);
  const clientByReference = useMemo(() => new Map((clients ?? []).map((client) => [client.referenceNo, client])), [clients]);
  const filteredClients = useMemo(
    () => {
      const matchingProductMembers = new Set(
        (loans ?? [])
          .filter((loan) => filters.product === "ALL" || loan.productName === filters.product)
          .map((loan) => loan.clientReference)
          .filter((reference): reference is string => Boolean(reference)),
      );
      return (clients ?? []).filter((client) =>
        memberMatches(client, filters) &&
        (filters.product === "ALL" || matchingProductMembers.has(client.referenceNo)),
      );
    },
    [clients, loans, filters],
  );
  const filteredLoans = useMemo(
    () => (loans ?? []).filter((loan) => loanMatches(loan, clientByReference.get(loan.clientReference ?? ""), filters)),
    [loans, clientByReference, filters],
  );

  const liveKpis = useMemo<KpiFixture[]>(() => {
    if (!clients || !loans) return data.kpis;
    const totalMembers = clients.length;
    const outstandingPrincipal = loans.reduce((sum, loan) => sum + BigInt(loan.outstandingPrincipalMinor || "0"), 0n);
    const arrearsLoans = loans.filter((loan) => (loan.daysPastDue ?? 0) > 0);
    const principalInArrears = arrearsLoans.reduce((sum, loan) => sum + BigInt(loan.outstandingPrincipalMinor || "0"), 0n);
    const clientsInArrears = new Set(arrearsLoans.map((loan) => loan.clientReference).filter(Boolean)).size;
    const byId = new Map(data.kpis.map((kpi) => [kpi.id, kpi]));
    return data.kpis.map((kpi) => {
      if (kpi.id === "total-members") return { ...kpi, value: String(totalMembers) };
      if (kpi.id === "outstanding-principal") return { ...kpi, value: outstandingPrincipal.toString() };
      if (kpi.id === "principal-in-arrears") return { ...kpi, value: principalInArrears.toString() };
      if (kpi.id === "clients-in-arrears") return { ...kpi, value: String(clientsInArrears) };
      return kpi;
    });
  }, [clients, loans, data.kpis]);

  function changeFilter(key: DashboardFilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-0">
      <div
        data-testid="dashboard-tab-card"
        className="flex h-[70.42px] items-center gap-[6.72px] rounded-[6px] border border-card-border bg-surface"
        style={{ padding: "20.16px" }}
      >
          <TabsList aria-label="Dashboard views" className="h-auto bg-transparent p-0" style={{ gap: "6.72px" }}>
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.value;
            return (
              <TabsTrigger
                key={item.value}
                value={item.value}
                data-testid={`dashboard-tab-${item.value}`}
                className={cn(
                  "flex-none shrink-0 rounded-[6px] border-0 shadow-none transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring/50 data-active:shadow-none",
                  "text-strong",
                )}
                style={{
                  width: item.value === "loans" ? 83.375 : 102.615,
                  height: 28.771,
                  gap: "6.72px",
                  padding: "6.72px 13.44px",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "13.333px",
                  backgroundColor: active ? "var(--primary)" : "transparent",
                  color: active ? "var(--text-on-primary)" : "var(--text-strong)",
                }}
              >
                <Icon className="size-[13.33px]" strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <TabsContent value="overview" className="mt-[13.44px] space-y-[13.44px] pb-[26.88px] outline-none">
        <KpiGrid kpis={liveKpis} />
        <FundsChart funds={data.funds} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" style={{ gap: "13.44px" }}>
          <SavingsSharesLoansChart />
          <ParBucketsChart />
        </div>
      </TabsContent>

      <TabsContent value="members" className="outline-none">
        {clients === null || loans === null ? (
          <div className="mt-[14px] rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
            <p className="fs-text text-muted-foreground">Loading member analytics...</p>
          </div>
        ) : (
          <MembersView
            clients={filteredClients}
            loans={filteredLoans}
            filters={filters}
            branches={branchOptions}
            products={productOptions}
            onFilterChange={changeFilter}
          />
        )}
      </TabsContent>

      <TabsContent value="loans" className="outline-none">
        {loans === null ? (
          <div className="mt-[14px] rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
            <p className="fs-text text-muted-foreground">Loading loan analytics...</p>
          </div>
        ) : filteredLoans.length > 0 ? (
          <LoansView
            loans={filteredLoans}
            filters={filters}
            branches={branchOptions}
            products={productOptions}
            onFilterChange={changeFilter}
          />
        ) : (
          <div className="mt-[20.16px] flex flex-col gap-[13.44px] pb-[26.88px]">
            <DashboardFilterBar filters={filters} branches={branchOptions} products={productOptions} onChange={changeFilter} />
            <div className="grid grid-cols-1 gap-[13.44px] sm:grid-cols-3" aria-label="Loan metrics">
              <StatCard kpi={metric("loans-disbursed", "Loans Disbursed", "0", "principal")} />
              <StatCard kpi={metric("amount-disbursed", "Amount Disbursed", formatTzs("0"), "till")} />
              <StatCard kpi={metric("total-defaults", "Total Defaults", "0", "portfolio-risk", "red")} />
            </div>
            <div className="grid grid-cols-1 gap-[20.16px] lg:grid-cols-2">
              <DashboardChartPanel title="Disbursements by Product" />
              <DashboardChartPanel title="Loan Application Stages" />
            </div>
            <DashboardChartPanel title="Loans Transactions Amount" height="large" />
            <div className="space-y-[13.44px]">
              <DashboardTablePanel title="Loan Product Insights" columns={["Product(s)", "Number of Loans", "Number of Defaults", "Average Period"]} rows={[]} minHeight={279.65} />
              <DashboardTablePanel title="Loan PAR Summary" columns={["Bucket (DPD)", "Number of Members", "Number of Loans", "Amount at Risk", "PAR %", "Overdue Amount"]} rows={[]} minHeight={316.46} />
              <DashboardTablePanel title="Loan Loss Ratios" columns={["Ratio", "Value"]} rows={[
                ["Charge-off Ratio", "—"], ["Recovery Ratio", "—"], ["Net Charge-off Ratio", "—"], ["Annual Loss Rate", "—"],
              ]} minHeight={279.65} />
              <DashboardTablePanel title="Loan Guarantor Exposure" columns={["Guarantor", "Loans Guaranteed", "Self Loans Guaranteed", "Total Exposure", "Loans In Arrears"]} rows={[]} search minHeight={290.4} />
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
