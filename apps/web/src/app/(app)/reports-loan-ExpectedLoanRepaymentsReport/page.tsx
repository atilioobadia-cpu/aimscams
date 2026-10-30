import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Expected loan repayments report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Expected loan repayments report" description="Expected loan repayments report." />;
}
