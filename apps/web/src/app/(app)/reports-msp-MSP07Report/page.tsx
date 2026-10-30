import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "MSP07 report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="MSP07 report" description="MSP07 report." />;
}
