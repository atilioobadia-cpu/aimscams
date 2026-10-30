import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "MSP01 report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="MSP01 report" description="MSP01 report." />;
}
