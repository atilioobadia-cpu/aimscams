import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Guarantors report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters title="Guarantors Report" filename="guarantors-report.csv" columns={[
    "Loan Account Number", "Client Name", "Loan Status", "Loan Officer", "Loan Product", "Guarantor",
    "Guarantor Savings Balance", "Share Capital", "Total Amount Guaranteed",
  ]} />;
}
