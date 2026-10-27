import { StatCard } from "@/components/data/stat-card";
import type { KpiFixture } from "@/lib/fixtures/dashboard";

export function KpiGrid({ kpis }: { kpis: KpiFixture[] }) {
  return (
    <section
      aria-label="Key performance indicators"
      data-testid="kpi-grid"
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
    >
      {kpis.map((kpi) => (
        <StatCard key={kpi.id} kpi={kpi} />
      ))}
    </section>
  );
}
