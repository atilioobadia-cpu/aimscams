import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Summarized portfolio at risk report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Summarized Portfolio At Risk Report" filename="summarized-portfolio-at-risk-report.csv" dateMode="as-of" columns={[
    "Branch", "Region", "Loan Officer", "Loan Product", "Outstanding Penalty", "Overdue Penalty", "Total Outstanding", "Total Overdue", "Portfolio At Risk",
  ]} />;
}
