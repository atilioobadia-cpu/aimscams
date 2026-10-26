import { StatCard } from "@/components/data/stat-card";
import type { KpiFixture } from "@/lib/fixtures/dashboard";

export function KpiGrid({ kpis }: { kpis: KpiFixture[] }) {
  return (
    <section
      aria-label="Key performance indicators"
      data-testid="kpi-grid"
      className="grid grid-cols-1 gap-[22px] md:grid-cols-2 2xl:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <StatCard key={kpi.id} kpi={kpi} />
      ))}
    </section>
  );
}
