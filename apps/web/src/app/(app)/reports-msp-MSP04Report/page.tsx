import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "MSP04 report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="MSP04 report" description="MSP04 report." />;
}
