import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Expected repayment report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Expected repayment report" description="Expected repayment report." />;
}
