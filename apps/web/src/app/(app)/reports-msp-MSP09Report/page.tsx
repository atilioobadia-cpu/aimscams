import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "MSP09 report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="MSP09 report" description="MSP09 report." />;
}
