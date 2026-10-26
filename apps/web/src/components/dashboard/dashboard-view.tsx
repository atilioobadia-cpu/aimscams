import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import type { DashboardFixture } from "@/lib/fixtures/dashboard";

export function DashboardView({ data }: { data: DashboardFixture }) {
  return <DashboardTabs data={data} />;
}
