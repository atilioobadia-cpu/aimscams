"use client";

import { BarChart3, Landmark, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardChartPanel } from "@/components/dashboard/dashboard-chart-panel";
import { DashboardFilterBar, type DashboardFilterKey, type DashboardFilters } from "@/components/dashboard/dashboard-filter-bar";
import { FundsChart } from "@/components/dashboard/funds-chart";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
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
  { value: "members", label: "Members", icon: Users },
  { value: "loans", label: "Loans", icon: Landmark },
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
  if (age < 18) return "UNDER_18";
  if (age <= 35) return "18_35";
  if (age <= 60) return "36_60";
  return "OVER_60";
}

function dateMatches(value: string | null | undefined, filter: string): boolean {
  if (filter === "ALL") return true;
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
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
  if (filters.age !== "ALL" && ageBucket(client) !== filters.age) return false;
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
}: {
  title: string;
  columns: string[];
  rows: string[][];
  emptyMessage?: string;
  search?: boolean;
}) {
  const [query, setQuery] = useState("");
  const visibleRows = rows.filter((row) => row.join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  return (
    <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
      <div className="flex min-h-[58px] flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <h2 className="fs-text font-bold text-strong">{title}</h2>
        {search ? (
          <input
            type="search"
            aria-label={`Search ${title}`}
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-8 w-[190px] rounded-[var(--control-radius)] border border-card-border bg-surface px-2.5 fs-text text-body outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        ) : null}
      </div>
      <div className="overflow-x-auto px-5 pb-5">
        <table className="w-full min-w-[540px] text-left fs-text">
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
                <tr key={`${title}-${rowIndex}`} className="border-b border-card-border last:border-0">
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

function MembersView({
  clients,
  loans,
  filters,
  branches,
  products,
  onFilterChange,
}: {
  clients: Client[];
  loans: Loan[];
  filters: DashboardFilters;
  branches: string[];
  products: string[];
  onFilterChange: (key: DashboardFilterKey, value: string) => void;
}) {
  const growth = growthSeries(clients);
  const growthRate = growth && growth.values[0] > 0
    ? `${(((growth.values.at(-1)! - growth.values[0]) / growth.values[0]) * 100).toFixed(2)}%`
    : "—";
  const count = clients.length;
  const active = clients.filter((client) => client.status === "ACTIVE").length;
  const newThisMonth = clients.filter((client) => dateMatches(client.joinedAt, "THIS_MONTH")).length;
  const inactive = clients.filter((client) => client.status === "INACTIVE").length;
  const churnRate = count > 0 ? `${((inactive / count) * 100).toFixed(2)}%` : "0.00%";
  const knownAgeCount = clients.filter((client) => ageOf(client) !== null).length;
  const youthCount = clients.filter((client) => {
    const age = ageOf(client);
    return client.status === "ACTIVE" && age !== null && age <= 35;
  }).length;
  const activeLoans = loans.filter((loan) => loan.status === "ACTIVE" || loan.status === "DISBURSED").length;
  const kpis = [
    metric("active-members", "Active Members", String(active), "members"),
    metric("new-members-mtd", "New Members (MTD)", String(newThisMonth), "members"),
    metric("growth-rate", "Growth Rate", growthRate, "portfolio-risk", "yellow"),
    metric("churn-rate", "Churn Rate", churnRate, "arrears-clients", "red"),
    metric("active-youth", "Active Youth Members", knownAgeCount ? String(youthCount) : "—", "members"),
    metric("inactive-90-days", "Inactive >90 days", "—", "unposted", "yellow"),
    metric("average-savings", "Avg. Savings", "—", "savings"),
    metric("with-active-loans", "With Active Loans", String(activeLoans), "principal"),
  ];

  return (
    <div className="mt-[14px] space-y-[14px]">
      <DashboardFilterBar filters={filters} branches={branches} products={products} onChange={onFilterChange} />
      <DashboardChartPanel
        title="Members Growth (Cumulative)"
        points={growth?.values}
        xLabels={growth?.labels}
        height="large"
        message="The local API has no member join history for this view."
      />
      <KpiGrid kpis={kpis} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DashboardChartPanel title="New Vs Recurring Members" />
        <DashboardChartPanel title="Registered Users Over Time" />
        <DashboardChartPanel title="Churned Users Over Time" />
        <DashboardChartPanel title="Members by Gender" />
        <DashboardChartPanel title="Members by Age Bands" />
        <DashboardChartPanel title="Members by Disability Status" />
        <DashboardChartPanel title="Members by Impairment Type" />
        <DashboardTablePanel
          title="Churned Members by Gender"
          columns={["Gender", "# of Churned Members"]}
          rows={[]}
        />
      </div>
    </div>
  );
}

function LoansView({
  loans,
  filters,
  branches,
  products,
  onFilterChange,
}: {
  loans: Loan[];
  filters: DashboardFilters;
  branches: string[];
  products: string[];
  onFilterChange: (key: DashboardFilterKey, value: string) => void;
}) {
  const disbursed = loans.filter((loan) => Boolean(loan.disbursedAt));
  const amountDisbursed = disbursed.reduce((sum, loan) => sum + BigInt(loan.principalMinor || "0"), 0n);
  const defaults = loans.filter((loan) => ["DELINQUENT", "NPA", "WRITTEN_OFF"].includes(loan.status));
  const kpis = [
    metric("loans-disbursed", "Loans Disbursed", String(disbursed.length), "principal"),
    metric("amount-disbursed", "Amount Disbursed", formatTzs(amountDisbursed.toString()), "till"),
    metric("total-defaults", "Total Defaults", String(defaults.length), "portfolio-risk", "red"),
  ];
  const productsByName = new Map<string, Loan[]>();
  for (const loan of loans) {
    const name = loan.productName ?? "Unassigned";
    productsByName.set(name, [...(productsByName.get(name) ?? []), loan]);
  }
  const productRows = [...productsByName.entries()].map(([name, rows]) => {
    const defaultCount = rows.filter((loan) => ["DELINQUENT", "NPA", "WRITTEN_OFF"].includes(loan.status)).length;
    const averageTenure = rows.length
      ? (rows.reduce((sum, loan) => sum + loan.tenureCount, 0) / rows.length).toFixed(2)
      : "—";
    return [name, String(rows.length), String(defaultCount), averageTenure];
  });
  const buckets = [
    { label: "Current", match: (dpd: number) => dpd <= 0 },
    { label: "1-30 days", match: (dpd: number) => dpd > 0 && dpd <= 30 },
    { label: "30-90 days", match: (dpd: number) => dpd > 30 && dpd <= 90 },
    { label: "90+ days", match: (dpd: number) => dpd > 90 },
  ];
  const parRows = buckets.map((bucket) => {
    const rows = loans.filter((loan) => bucket.match(loan.daysPastDue));
    const exposure = rows.reduce((sum, loan) => sum + BigInt(loan.outstandingPrincipalMinor || "0"), 0n);
    const memberCount = new Set(rows.map((loan) => loan.clientReference).filter(Boolean)).size;
    return [bucket.label, String(memberCount), String(rows.length), formatTzs(exposure.toString()), "—", "—"];
  });
  const lossRows = [
    ["Charge-off Ratio", "—"],
    ["Recovery Ratio", "—"],
    ["Net Charge-off Ratio", "—"],
    ["Annual Loss Rate", "—"],
  ];

  return (
    <div className="mt-[14px] space-y-[14px]">
      <DashboardFilterBar filters={filters} branches={branches} products={products} onChange={onFilterChange} />
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Loan metrics">
        {kpis.map((kpi) => <StatCard key={kpi.id} kpi={kpi} />)}
      </section>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DashboardChartPanel title="Disbursements by Product" />
        <DashboardChartPanel title="Loan Application Stages" />
      </div>
      <DashboardChartPanel title="Loans Transactions Amount" height="large" />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <DashboardTablePanel
          title="Loan Product Insights"
          columns={["Product(s)", "Number of Loans", "Number of Defaults", "Average Period"]}
          rows={productRows}
        />
        <DashboardTablePanel
          title="Loan PAR Summary"
          columns={["Bucket (DPD)", "Number of Members", "Number of Loans", "Amount at Risk", "PAR %", "Overdue Amount"]}
          rows={parRows}
        />
        <DashboardTablePanel title="Loan Loss Ratios" columns={["Ratio", "Value"]} rows={lossRows} />
        <DashboardTablePanel
          title="Loan Guarantor Exposure"
          columns={["Guarantor", "Loans Guaranteed", "Self Loans Guaranteed", "Total Exposure", "Loans In Arrears"]}
          rows={[]}
          search
        />
      </div>
    </div>
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

  function changeFilter(key: DashboardFilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-0">
      <div
        data-testid="dashboard-tab-card"
        className="flex h-[70px] items-center gap-4 rounded-[var(--card-radius)] border border-card-border bg-surface px-5"
      >
        <TabsList aria-label="Dashboard views" className="h-auto gap-2 bg-transparent p-0">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.value;
            return (
              <TabsTrigger
                key={item.value}
                value={item.value}
                data-testid={`dashboard-tab-${item.value}`}
                className={cn(
                  "flex-none shrink-0 gap-2 rounded-[var(--pill-radius)] border-0 px-0 fs-text font-medium shadow-none transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring/50 data-active:shadow-none",
                  active ? "font-semibold" : "text-strong",
                )}
                style={{
                  width: 102,
                  height: 30,
                  backgroundColor: active ? "var(--primary)" : "transparent",
                  color: active ? "var(--text-on-primary)" : "var(--text-strong)",
                }}
              >
                <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      <TabsContent value="overview" className="mt-[14px] space-y-[14px] outline-none">
        <KpiGrid kpis={data.kpis} />
        <FundsChart funds={data.funds} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
          <div className="mt-[14px] space-y-[14px]">
            <DashboardFilterBar filters={filters} branches={branchOptions} products={productOptions} onChange={changeFilter} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Loan metrics">
              <StatCard kpi={metric("loans-disbursed", "Loans Disbursed", "0", "principal")} />
              <StatCard kpi={metric("amount-disbursed", "Amount Disbursed", formatTzs("0"), "till")} />
              <StatCard kpi={metric("total-defaults", "Total Defaults", "0", "portfolio-risk", "red")} />
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <DashboardChartPanel title="Disbursements by Product" />
              <DashboardChartPanel title="Loan Application Stages" />
            </div>
            <DashboardChartPanel title="Loans Transactions Amount" height="large" />
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <DashboardTablePanel title="Loan Product Insights" columns={["Product(s)", "Number of Loans", "Number of Defaults", "Average Period"]} rows={[]} />
              <DashboardTablePanel title="Loan PAR Summary" columns={["Bucket (DPD)", "Number of Members", "Number of Loans", "Amount at Risk", "PAR %", "Overdue Amount"]} rows={[]} />
              <DashboardTablePanel title="Loan Loss Ratios" columns={["Ratio", "Value"]} rows={[
                ["Charge-off Ratio", "—"], ["Recovery Ratio", "—"], ["Net Charge-off Ratio", "—"], ["Annual Loss Rate", "—"],
              ]} />
              <DashboardTablePanel title="Loan Guarantor Exposure" columns={["Guarantor", "Loans Guaranteed", "Self Loans Guaranteed", "Total Exposure", "Loans In Arrears"]} rows={[]} search />
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
