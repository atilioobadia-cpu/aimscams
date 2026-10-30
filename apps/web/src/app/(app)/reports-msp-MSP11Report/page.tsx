import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "MSP11 report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="MSP11 report" description="MSP11 report." />;
}
