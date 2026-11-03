import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Loan outstanding report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Loan Outstanding Report" filename="loan-outstanding-report.csv" dateMode="as-of" columns={[
    "Account Number", "Client Name", "Loan Product", "Loan Officer", "Branch", "Group", "Total Outstanding Principal",
    "Total Outstanding Interest", "Total Outstanding Charges", "Total Outstanding Amount", "Total In Arrears",
  ]} />;
}
