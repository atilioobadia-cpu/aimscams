import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Summarized portfolio at risk report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Summarized portfolio at risk report" description="Summarized portfolio at risk report." />;
}
