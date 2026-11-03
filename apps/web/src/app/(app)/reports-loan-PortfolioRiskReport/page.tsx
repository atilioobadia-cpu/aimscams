import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Portfolio risk report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Portfolio Risk Report" filename="portfolio-risk-report.csv" dateMode="as-of" columns={[
    "Branch", "Group", "Loan Officer", "Loan Product", "Outstanding Principal", "Arrears", "Arrears Rate", "Risk Percentage", "Last Repayment Amount",
  ]} />;
}
