import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Loan repayment schedule report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters
    title="Loan Repayment Schedule Report"
    filename="loan-repayment-schedule-report.csv"
    columns={[
      "Account Number", "Client Name", "Loan Product", "Loan Officer", "Branch", "Group",
      "Installment Number", "Due Date", "Principal Due", "Interest Due", "Total Due", "Balance",
    ]}
  />;
}
