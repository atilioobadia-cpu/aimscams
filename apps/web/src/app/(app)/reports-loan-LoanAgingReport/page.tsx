import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Loan aging report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters title="Loan Aging Report" filename="loan-aging-report.csv" dateMode="as-of" columns={[
    "Account Number", "Client Name", "Loan Product", "Branch", "Loan Officer",
    "Performing", "Watch", "Substandard", "Doubtful", "Loss", "Total",
  ]} />;
}
