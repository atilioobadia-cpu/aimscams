import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Loan repayment report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Loan Repayment Report" filename="loan-repayment-report.csv" columns={[
    "Account Number", "Client Name", "Loan Product", "Loan Officer", "Region", "Tenure", "Principal Repaid", "Interest Repaid", "Charges Repaid", "Total Repaid",
  ]} />;
}
