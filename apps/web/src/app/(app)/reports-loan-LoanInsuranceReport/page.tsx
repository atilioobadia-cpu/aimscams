import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Loan insurance report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters title="Loan Insurance Report" filename="loan-insurance-report.csv" columns={[
    "Account Number", "Client Name", "Loan Product", "Loan Officer", "Branch", "Group", "Tenure Type", "Tenure",
    "Insurance Premium", "Reference Number", "Service Provider",
  ]} />;
}
