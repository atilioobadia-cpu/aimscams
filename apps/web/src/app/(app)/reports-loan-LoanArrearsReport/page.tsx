import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Loan arrears report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Loan Arrears Report" filename="loan-arrears-report.csv" columns={[
    "Account Number", "Client Name", "Loan Product", "Loan Officer", "Branch", "Group", "Principal In Arrears",
    "Interest In Arrears", "Penalty In Arrears", "Total In Arrears", "Principal In Arrears Percentage", "Days In Arrears",
  ]} />;
}
