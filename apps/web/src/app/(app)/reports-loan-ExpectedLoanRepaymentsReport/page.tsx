import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Expected loan repayments report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters title="Expected Loan Repayments Report" filename="expected-loan-repayments-report.csv" columns={[
    "Account Number", "Client Name", "Loan Product", "Loan Officer", "Branch", "Group", "Due Date",
    "Expected Principal", "Expected Accrued Interest", "Total Repayment Amount",
  ]} />;
}
