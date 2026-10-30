import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "MSP08 report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="MSP08 report" description="MSP08 report." />;
}
