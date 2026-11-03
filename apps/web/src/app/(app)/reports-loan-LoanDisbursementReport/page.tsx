import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Loan disbursement report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Loan Disbursement Report" filename="loan-disbursement-report.csv" columns={[
    "Account Number", "Client Name", "Loan Date", "Loan Product", "Principal Amount", "Total Interest", "Loan Officer",
    "Group", "Region", "Debt Capacity", "Description",
  ]} />;
}
