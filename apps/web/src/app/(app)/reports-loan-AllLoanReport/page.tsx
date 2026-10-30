import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "All loan report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="All loan report" description="All loan report." />;
}
