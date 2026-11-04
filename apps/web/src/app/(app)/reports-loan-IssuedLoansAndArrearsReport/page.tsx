import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Issued loans and arrears report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters title="Issued Loans And Arrears Report" filename="issued-loans-and-arrears-report.csv" columns={[
    "Account Number", "Client Name", "Loan Product", "Loan Officer", "Branch", "Group", "Disbursement Date",
    "Principal Amount", "Outstanding Principal", "Charges In Arrears", "Outstanding Penalty", "Penalty In Arrears", "Total In Arrears",
  ]} />;
}
