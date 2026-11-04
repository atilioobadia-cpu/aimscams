import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Expected repayment report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters title="Expected Repayment Report" filename="expected-repayment-report.csv" columns={[
    "Account Number", "Client Name", "Loan Product", "Loan Officer", "Branch", "Group", "Due Date",
    "Principal Balance", "Principal Due", "Interest Due", "Penalty Due", "Total Due",
  ]} />;
}
