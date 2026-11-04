import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Expected payment by date report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters title="Expected Payment By Date Report" filename="expected-payment-by-date-report.csv" columns={[
    "Account Number", "Client Name", "Loan Product", "Loan Officer", "Branch", "Group", "Due Date",
    "Principal Due", "Interest Due", "Fee Due", "Total Due", "Total Overdue",
  ]} />;
}
