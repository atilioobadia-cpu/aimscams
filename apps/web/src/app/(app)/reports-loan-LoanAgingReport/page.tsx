import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Loan aging report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Loan aging report" description="Loan aging report." />;
}
