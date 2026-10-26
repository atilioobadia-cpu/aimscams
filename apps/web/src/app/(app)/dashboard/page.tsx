import type { Metadata } from "next";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { dashboardFixture } from "@/lib/fixtures/dashboard";

export const metadata: Metadata = {
  title: "Dashboard · AIMSCAMS",
  description: "Branch portfolio, funds flow and unposted transactions.",
};

export default function DashboardPage() {
  return <DashboardView data={dashboardFixture} />;
}
