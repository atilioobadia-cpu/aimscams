import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "MSP06 report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="MSP06 report" description="MSP06 report." />;
}
