"use client";

import { useEffect, useState } from "react";

import { DashboardFilterBar, type DashboardFilterKey, type DashboardFilters } from "@/components/dashboard/dashboard-filter-bar";
import {
  ChurnedUsersChart,
  MemberGrowthChart,
  NewVsRecurringChart,
  RegisteredUsersChart,
} from "@/components/dashboard/members-charts";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { StatCard } from "@/components/data/stat-card";
import type { Client, Loan } from "@/lib/settings";
import { listSavingsAccounts } from "@/lib/settings";
import type { KpiFixture } from "@/lib/fixtures/dashboard";
import { formatTzs } from "@/lib/format";
import { cn } from "cn";

function metric(id: string, label: string, value: string, icon: KpiFixture["icon"], accent: KpiFixture["accent"] = "teal"): KpiFixture {
  return { id, label, value, format: "text", icon, accent };
}

function ageOf(client: Client): number | null {
  const profile = (client.profile && typeof client.profile === "object" ? client.profile : {}) as Record<string, unknown>;
  const personal = (profile.personal && typeof profile.personal === "object" ? profile.personal : {}) as Record<string, unknown>;
  const directAge = Number(personal.age ?? profile.age);
  if (Number.isFinite(directAge) && directAge >= 0 && directAge < 130) return directAge;
  const birthDate = personal.dateOfBirth ?? profile.dateOfBirth ?? profile.birthDate ?? profile.dob;
  if (typeof birthDate !== "string") return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

function dateMatches(value: string | null | undefined, filter: string): boolean {
  if (filter === "ALL") return true;
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (filter.startsWith("ON:")) return value.slice(0, 10) === filter.slice(3);
  const today = new Date();
  if (filter === "THIS_MONTH") return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
  if (filter === "THIS_YEAR") return date.getFullYear() === today.getFullYear();
  if (filter === "LAST_90_DAYS") {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 90);
    return date >= cutoff && date <= today;
  }
  return true;
}

export function MembersView({
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
  const [savingsAccounts, setSavingsAccounts] = useState<Array<{ balanceMinor: string }> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listSavingsAccounts()
      .then((response) => {
        if (!cancelled) setSavingsAccounts(response.items);
      })
      .catch(() => {
        if (!cancelled) setSavingsAccounts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = clients.filter((client) => client.status === "ACTIVE").length;
  const newThisMonth = clients.filter((client) => dateMatches(client.joinedAt, "THIS_MONTH")).length;
  const inactive = clients.filter((client) => client.status === "INACTIVE").length;
  const total = clients.length;
  const previousActive = clients.filter((client) => {
    const date = client.joinedAt ? new Date(client.joinedAt) : null;
    const endOfPreviousMonth = new Date();
    endOfPreviousMonth.setDate(0);
    endOfPreviousMonth.setHours(23, 59, 59, 999);
    return client.status === "ACTIVE" && !!date && date <= endOfPreviousMonth;
  }).length;
  const growthRate = previousActive > 0 ? ((active - previousActive) / previousActive) * 100 : null;
  const churnRate = total > 0 ? (inactive / total) * 100 : null;
  const activeYouth = clients.filter((client) => {
    const age = ageOf(client);
    return client.status === "ACTIVE" && age !== null && age <= 35;
  }).length;
  const averageSavingsMinor =
    savingsAccounts && savingsAccounts.length > 0
      ? (
          savingsAccounts.reduce((sum, account) => sum + BigInt(account.balanceMinor || "0"), 0n) /
          BigInt(savingsAccounts.length)
        ).toString()
      : null;
  const activeLoanReferences = new Set(
    loans
      .filter((loan) => loan.status === "ACTIVE" || loan.status === "DISBURSED")
      .map((loan) => loan.clientReference)
      .filter((reference): reference is string => Boolean(reference)),
  );
  const withActiveLoans = clients.filter((client) => activeLoanReferences.has(client.referenceNo)).length;

  const kpis = [
    metric("active-members", "Active Members", String(active), "members"),
    metric("new-members-mtd", "New Members (MTD)", String(newThisMonth), "members"),
    metric("growth-rate", "Growth Rate", growthRate === null ? "—" : `${growthRate.toFixed(2)}%`, "portfolio-risk", "yellow"),
    metric("churn-rate", "Churn Rate", churnRate === null ? "—" : `${churnRate.toFixed(2)}%`, "arrears-clients", "red"),
    metric("active-youth", "Active Youth Members", String(activeYouth), "members"),
    metric("inactive-90-days", "Inactive >90 days", String(inactive), "unposted", "yellow"),
    metric("average-savings", "Avg. Savings", averageSavingsMinor === null ? "—" : formatTzs(averageSavingsMinor), "savings"),
    metric("with-active-loans", "With Active Loans", String(withActiveLoans), "principal"),
  ];

  return (
    <div className="mt-[20.16px] flex flex-col gap-[13.44px] pb-[26.88px]">
      <DashboardFilterBar filters={filters} branches={branches} products={products} onChange={onFilterChange} />
      <MemberGrowthChart clients={clients} />
      <KpiGrid kpis={kpis} />
      <NewVsRecurringChart clients={clients} />
      <RegisteredUsersChart clients={clients} />
      <ChurnedUsersChart />
      <section className="min-h-[254.77px] overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
        <div className="flex min-h-[58px] flex-wrap items-center justify-between gap-3 px-5 pt-4">
          <h2 className="fs-text font-bold text-strong">Churned Members by Gender</h2>
        </div>
        <div className="overflow-x-auto px-5 pb-5">
          <table className="dashboard-parity-table w-full min-w-[540px] text-left fs-text">
            <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
              <tr>
                <th className="whitespace-nowrap px-3 py-2.5 text-left">Gender</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right"># of Churned Members</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2} className="px-3 py-5 text-center text-muted-foreground">No local churn records available.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
