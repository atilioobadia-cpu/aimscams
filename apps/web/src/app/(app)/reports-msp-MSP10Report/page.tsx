import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "MSP10 report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="MSP10 report" description="MSP10 report." />;
}
