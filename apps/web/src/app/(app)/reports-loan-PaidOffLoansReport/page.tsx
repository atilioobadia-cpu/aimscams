import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Paid off loans report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters title="Paid Off Loans Report" filename="paid-off-loans-report.csv" columns={[
    "Account Number", "Client Name", "Loan Product", "Loan Officer", "Branch", "Group", "Loan Date", "Expiry Date", "Principal Paid", "Interest Paid", "Total Paid",
  ]} />;
}
