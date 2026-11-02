"use client";

import { ChartCard } from "@/components/data/chart-card";
import { cn } from "cn";

const MONTHS = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const MONTH_STARTS = MONTHS.map((_, index) => new Date(2025, 11 + index, 1));

function monthEnd(index: number): Date {
  return new Date(2025, 12 + index, 0, 23, 59, 59, 999);
}

function joinedDate(client: { joinedAt?: string | null; createdAt?: string }): Date | null {
  const value = client.joinedAt ?? client.createdAt;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function ageOf(profile: unknown): number | null {
  const p = (profile && typeof profile === "object" ? profile : {}) as Record<string, unknown>;
  const personal = (p.personal && typeof p.personal === "object" ? p.personal : {}) as Record<string, unknown>;
  const direct = Number(personal.age ?? p.age);
  if (Number.isFinite(direct) && direct >= 0 && direct < 130) return direct;
  const birth = personal.dateOfBirth ?? p.dateOfBirth ?? p.birthDate ?? p.dob;
  if (typeof birth !== "string") return null;
  const date = new Date(birth);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  if (today < new Date(today.getFullYear(), date.getMonth(), date.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

function genderOf(profile: unknown): "Female" | "Male" | "Not Defined" {
  const p = (profile && typeof profile === "object" ? profile : {}) as Record<string, unknown>;
  const personal = (p.personal && typeof p.personal === "object" ? p.personal : {}) as Record<string, unknown>;
  const raw = String(personal.gender ?? p.gender ?? p.sex ?? "").trim().toLowerCase();
  if (raw.startsWith("f")) return "Female";
  if (raw.startsWith("m")) return "Male";
  return "Not Defined";
}

function disabilityOf(profile: unknown): string {
  const p = (profile && typeof profile === "object" ? profile : {}) as Record<string, unknown>;
  const personal = (p.personal && typeof p.personal === "object" ? p.personal : {}) as Record<string, unknown>;
  const raw = String(personal.disability ?? p.disability ?? "").trim();
  if (!raw) return "Not Defined";
  return raw.toLowerCase() === "no" ? "No disability" : raw;
}

function impairmentOf(profile: unknown): string {
  const p = (profile && typeof profile === "object" ? profile : {}) as Record<string, unknown>;
  const personal = (p.personal && typeof p.personal === "object" ? p.personal : {}) as Record<string, unknown>;
  const raw = String(personal.impairmentType ?? personal.impairment ?? p.impairmentType ?? p.impairment ?? "").trim();
  return raw || "Not Defined";
}

function ageBand(age: number | null): string {
  if (age === null) return "Not Defined";
  if (age < 25) return "<25";
  if (age <= 34) return "25-34";
  if (age <= 44) return "35-44";
  if (age <= 54) return "45-54";
  return "55+";
}

const AGE_BANDS = ["<25", "25-34", "35-44", "45-54", "55+", "Not Defined"];

function EmptyPlot({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <p className="max-w-[260px] text-center fs-text text-muted-foreground">{label}</p>
    </div>
  );
}

export function MemberGrowthChart({ clients }: { clients: Array<{ joinedAt?: string | null; createdAt?: string; status?: string }> }) {
  const totals = MONTH_STARTS.map((_, index) => {
    const end = monthEnd(index);
    return clients.filter((client) => {
      const date = joinedDate(client);
      return !!date && date <= end;
    }).length;
  });
  const actives = MONTH_STARTS.map((_, index) => {
    const end = monthEnd(index);
    return clients.filter((client) => {
      const date = joinedDate(client);
      return client.status === "ACTIVE" && !!date && date <= end;
    }).length;
  });
  const max = Math.max(1, ...totals, ...actives);
  const yTicks = [0, 1, 2, 3, 4].map((line) => Math.round(max * (1 - line / 4)));

  function x(index: number): number {
    return (index / (MONTHS.length - 1)) * 1000;
  }
  function y(value: number): number {
    return 190 - (value / max) * 170;
  }

  return (
    <ChartCard title="Members Growth (Cumulative)" className="px-5 pt-9 pb-5">
      <div className="relative mt-4 h-[300px]">
        <div className="absolute inset-y-3 left-[68px] right-0 flex flex-col justify-between">
          {yTicks.map((tick, index) => (
            <div key={index} className="relative border-t border-grid-line">
              <span className="absolute -left-[62px] -top-2 w-[54px] text-right fs-text leading-none text-axis">{tick}</span>
            </div>
          ))}
        </div>
        <svg aria-label="Members growth" className="absolute inset-y-3 left-[68px] h-[calc(100%-12px)] w-[calc(100%-68px)] overflow-visible" viewBox="0 0 1000 200" preserveAspectRatio="none" role="img">
          <polyline points={totals.map((value, index) => `${x(index)},${y(value)}`).join(" ")} fill="none" stroke="var(--primary)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          <polyline points={actives.map((value, index) => `${x(index)},${y(value)}`).join(" ")} fill="none" stroke="#374957" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          {totals.map((value, index) => (
            <g key={`total-${index}`}>
              <circle cx={x(index)} cy={y(value)} r="4" fill="var(--primary)" />
              <text x={x(index)} y={y(value) - 8} textAnchor="middle" className="fill-strong fs-text">{value}</text>
            </g>
          ))}
          {actives.map((value, index) => (
            <g key={`active-${index}`}>
              <circle cx={x(index)} cy={y(value)} r="4" fill="#374957" />
            </g>
          ))}
        </svg>
        <div className="absolute bottom-0 left-[68px] right-0 flex justify-between gap-1 fs-text text-axis">
          {MONTHS.map((label, index) => (
            <span key={`${label}-${index}`} className="min-w-0 truncate text-center">{label}</span>
          ))}
        </div>
      </div>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-card-border pt-4">
        <li className="flex items-center gap-2 fs-text text-body"><span className="size-3 border-2 border-primary" aria-hidden="true" />Total Members</li>
        <li className="flex items-center gap-2 fs-text text-body"><span className="size-3 border-2 border-slate-600" aria-hidden="true" />Active Members</li>
      </ul>
    </ChartCard>
  );
}

export function NewVsRecurringChart({ clients }: { clients: Array<{ joinedAt?: string | null; createdAt?: string; status?: string }> }) {
  const newCounts = MONTH_STARTS.map((_, index) => {
    const start = MONTH_STARTS[index];
    const end = monthEnd(index);
    return clients.filter((client) => {
      const date = joinedDate(client);
      return !!date && date >= start && date <= end;
    }).length;
  });
  const recurringCounts = MONTH_STARTS.map((_, index) => {
    const end = monthEnd(index);
    return clients.filter((client) => {
      const date = joinedDate(client);
      return client.status === "ACTIVE" && !!date && date < MONTH_STARTS[index];
    }).length;
  });
  const max = Math.max(1, ...newCounts.map((value, index) => value + recurringCounts[index]));
  const hasData = newCounts.some((value, index) => value + recurringCounts[index] > 0);

  return (
    <ChartCard title="New Vs Recurring Members" className="px-5 pt-9 pb-5">
      <div className="relative mt-4 h-[300px]">
        <div className="absolute inset-y-3 left-[68px] right-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className="relative border-t border-grid-line">
              <span className="absolute -left-[62px] -top-2 w-[54px] text-right fs-text leading-none text-axis">{Math.round(max * (1 - line / 4))}</span>
            </div>
          ))}
        </div>
        <div className="absolute inset-y-3 left-[68px] right-0 flex items-end justify-between gap-1">
          {MONTHS.map((month, index) => {
            const total = newCounts[index] + recurringCounts[index];
            const newHeight = (newCounts[index] / max) * 100;
            const recurringHeight = (recurringCounts[index] / max) * 100;
            return (
              <div key={month} className="relative flex h-full w-[6%] flex-col justify-end">
                {total > 0 ? <span className="absolute -top-5 left-1/2 -translate-x-1/2 fs-text text-strong">{total}</span> : null}
                <div className="w-full bg-accent-teal" style={{ height: `${newHeight}%` }} />
                <div className="w-full bg-accent-red" style={{ height: `${recurringHeight}%` }} />
              </div>
            );
          })}
        </div>
        {!hasData ? <EmptyPlot label="No local member history is available for this range." /> : null}
        <div className="absolute bottom-0 left-[68px] right-0 flex justify-between gap-1 fs-text text-axis">
          {MONTHS.map((label, index) => (
            <span key={`${label}-${index}`} className="min-w-0 truncate text-center">{label}</span>
          ))}
        </div>
      </div>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-card-border pt-4">
        <li className="flex items-center gap-2 fs-text text-body"><span className="size-3 bg-accent-teal" aria-hidden="true" />New</li>
        <li className="flex items-center gap-2 fs-text text-body"><span className="size-3 bg-accent-red" aria-hidden="true" />Recurring</li>
      </ul>
    </ChartCard>
  );
}

export function RegisteredUsersChart({ clients }: { clients: Array<{ joinedAt?: string | null; createdAt?: string }> }) {
  const counts = MONTH_STARTS.map((_, index) => {
    const start = MONTH_STARTS[index];
    const end = monthEnd(index);
    return clients.filter((client) => {
      const date = joinedDate(client);
      return !!date && date >= start && date <= end;
    }).length;
  });
  const max = Math.max(1, ...counts);
  const hasData = counts.some((value) => value > 0);

  return (
    <ChartCard title="Registered Users Over Time" className="px-5 pt-9 pb-5">
      <div className="relative mt-4 h-[300px]">
        <div className="absolute inset-y-3 left-[68px] right-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className="relative border-t border-grid-line">
              <span className="absolute -left-[62px] -top-2 w-[54px] text-right fs-text leading-none text-axis">{Math.round(max * (1 - line / 4))}</span>
            </div>
          ))}
        </div>
        <div className="absolute inset-y-3 left-[68px] right-0 flex items-end justify-between gap-1">
          {MONTHS.map((month, index) => {
            const height = (counts[index] / max) * 100;
            return (
              <div key={month} className="relative flex h-full w-[6%] flex-col justify-end">
                {counts[index] > 0 ? <span className="absolute -top-5 left-1/2 -translate-x-1/2 fs-text text-strong">{counts[index]}</span> : null}
                <div className="w-full bg-primary" style={{ height: `${height}%` }} />
              </div>
            );
          })}
        </div>
        {!hasData ? <EmptyPlot label="No local registration history is available for this range." /> : null}
        <div className="absolute bottom-0 left-[68px] right-0 flex justify-between gap-1 fs-text text-axis">
          {MONTHS.map((label, index) => (
            <span key={`${label}-${index}`} className="min-w-0 truncate text-center">{label}</span>
          ))}
        </div>
      </div>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-card-border pt-4">
        <li className="flex items-center gap-2 fs-text text-body"><span className="size-3 bg-primary" aria-hidden="true" />Registered Users</li>
      </ul>
    </ChartCard>
  );
}

export function ChurnedUsersChart() {
  return (
    <ChartCard title="Churned Users Over Time" className="px-5 pt-9 pb-5">
      <div className="relative mt-4 h-[300px]">
        <div className="absolute inset-y-3 left-[68px] right-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className="relative border-t border-grid-line">
              <span className="absolute -left-[62px] -top-2 w-[54px] text-right fs-text leading-none text-axis">{line === 0 ? 5 : Math.round(5 * (1 - line / 4))}</span>
            </div>
          ))}
        </div>
        <EmptyPlot label="No local churn history is available for this range." />
        <div className="absolute bottom-0 left-[68px] right-0 flex justify-between gap-1 fs-text text-axis">
          {MONTHS.map((label, index) => (
            <span key={`${label}-${index}`} className="min-w-0 truncate text-center">{label}</span>
          ))}
        </div>
      </div>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-card-border pt-4">
        <li className="flex items-center gap-2 fs-text text-body"><span className="size-3 bg-chart-bar" aria-hidden="true" />Churned Users</li>
      </ul>
    </ChartCard>
  );
}

function Doughnut({ title, segments }: { title: string; segments: Array<{ label: string; value: number; color: string }> }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let offset = 0;
  return (
    <ChartCard title={title} className="px-5 pt-9 pb-5">
      <div className="relative mt-4 flex h-[260px] items-center justify-center">
        {total > 0 ? (
          <svg viewBox="0 0 120 120" className="h-[220px] w-[220px] -rotate-90">
            {segments.map((segment) => {
              const length = (segment.value / total) * 376.99;
              const dashOffset = offset;
              offset += length;
              return <circle key={segment.label} cx="60" cy="60" r="60" fill="none" stroke={segment.color} strokeWidth="24" strokeDasharray={`${length} 376.99`} strokeDashoffset={-dashOffset} />;
            })}
            <circle cx="60" cy="60" r="48" fill="var(--bg-surface)" />
          </svg>
        ) : (
          <EmptyPlot label="No local data is available." />
        )}
      </div>
      <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-card-border pt-4">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 fs-text text-body">
            <span className="size-3" style={{ backgroundColor: segment.color }} aria-hidden="true" />
            {segment.label}
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

export function GenderDoughnut({ clients }: { clients: Array<{ profile?: unknown }> }) {
  const counts = { Female: 0, Male: 0, "Not Defined": 0 };
  clients.forEach((client) => {
    counts[genderOf(client.profile)] += 1;
  });
  return <Doughnut title="Members by Gender" segments={[
    { label: "Female", value: counts.Female, color: "#c75a43" },
    { label: "Male", value: counts.Male, color: "#374957" },
    { label: "Not Defined", value: counts["Not Defined"], color: "var(--primary)" },
  ]} />;
}

export function DisabilityDoughnut({ clients }: { clients: Array<{ profile?: unknown }> }) {
  const counts = new Map<string, number>();
  clients.forEach((client) => {
    const label = disabilityOf(client.profile);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  if (counts.size === 0) counts.set("Not Defined", 0);
  return <Doughnut title="Members by Disability Status" segments={[...counts.entries()].map(([label, value]) => ({
    label,
    value,
    color: label === "Not Defined" ? "var(--primary)" : "#374957",
  }))} />;
}

export function ImpairmentDoughnut({ clients }: { clients: Array<{ profile?: unknown }> }) {
  const counts = new Map<string, number>();
  clients.forEach((client) => {
    const label = impairmentOf(client.profile);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  if (counts.size === 0) counts.set("Not Defined", 0);
  return <Doughnut title="Members by Impairment Type" segments={[...counts.entries()].map(([label, value]) => ({
    label,
    value,
    color: label === "Not Defined" ? "var(--primary)" : "#374957",
  }))} />;
}

export function AgeBandsChart({ clients }: { clients: Array<{ profile?: unknown; status?: string }> }) {
  const bands = AGE_BANDS.map((band) => ({ band, Male: 0, Female: 0, "Not Defined": 0 }));
  const index = new Map(bands.map((band, position) => [band.band, position]));
  clients.forEach((client) => {
    const band = ageBand(ageOf(client.profile));
    const gender = genderOf(client.profile);
    const row = bands[index.get(band)!];
    row[gender] += 1;
  });
  const max = Math.max(1, ...bands.flatMap((band) => [band.Male, band.Female, band["Not Defined"]]));

  return (
    <ChartCard title="Members by Age Bands" className="px-5 pt-9 pb-5">
      <div className="relative mt-4 h-[300px]">
        <div className="absolute inset-y-3 left-[68px] right-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className="relative border-t border-grid-line">
              <span className="absolute -left-[62px] -top-2 w-[54px] text-right fs-text leading-none text-axis">{Math.round(max * (1 - line / 4))}</span>
            </div>
          ))}
        </div>
        <div className="absolute inset-y-3 left-[68px] right-0 flex items-end justify-between gap-1">
          {bands.map((band) => (
            <div key={band.band} className="flex h-full w-[12%] items-end justify-center gap-1">
              <div className="w-1/3 bg-slate-700" style={{ height: `${(band.Male / max) * 100}%` }} />
              <div className="w-1/3 bg-accent-red" style={{ height: `${(band.Female / max) * 100}%` }} />
              <div className="w-1/3 bg-primary" style={{ height: `${(band["Not Defined"] / max) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-[68px] right-0 flex justify-between gap-1 fs-text text-axis">
          {AGE_BANDS.map((label, index) => (
            <span key={`${label}-${index}`} className="min-w-0 truncate text-center">{label}</span>
          ))}
        </div>
      </div>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-card-border pt-4">
        <li className="flex items-center gap-2 fs-text text-body"><span className="size-3 bg-slate-700" aria-hidden="true" />Male</li>
        <li className="flex items-center gap-2 fs-text text-body"><span className="size-3 bg-accent-red" aria-hidden="true" />Female</li>
        <li className="flex items-center gap-2 fs-text text-body"><span className="size-3 bg-primary" aria-hidden="true" />Not Defined</li>
      </ul>
    </ChartCard>
  );
}
