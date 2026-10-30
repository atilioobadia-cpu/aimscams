import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Loan repayment report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Loan repayment report" description="Loan repayment report." />;
}
