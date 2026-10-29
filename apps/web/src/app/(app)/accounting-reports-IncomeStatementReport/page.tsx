import type { Metadata } from "next";

import { IncomeStatementReportPage } from "@/components/accounting/income-statement-report-page";

export const metadata: Metadata = { title: "Income statement · AIMSCAMS" };

export default function IncomeStatementReportRoute() {
  return <IncomeStatementReportPage />;
}
