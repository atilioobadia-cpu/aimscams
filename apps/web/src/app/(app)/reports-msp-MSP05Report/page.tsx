import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "MSP05 report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="MSP05 report" description="MSP05 report." />;
}
