import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Paid off loans report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Paid off loans report" description="Paid off loans report." />;
}
