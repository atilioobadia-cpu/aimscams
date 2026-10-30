import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "MSP02 report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="MSP02 report" description="MSP02 report." />;
}
