import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "MSP03 type2 report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="MSP03 type2 report" description="MSP03 type2 report." />;
}
