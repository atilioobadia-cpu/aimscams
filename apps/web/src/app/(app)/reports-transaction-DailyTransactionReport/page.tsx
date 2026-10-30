import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Daily transaction report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Daily transaction report" description="Daily transaction report." />;
}
