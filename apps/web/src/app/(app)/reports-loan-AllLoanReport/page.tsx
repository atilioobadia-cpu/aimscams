import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "All loan report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters
    title="All Loan Report"
    filename="all-loan-report.csv"
    columns={[
      "Account Number", "Client Name", "Reference Number", "Loan Product", "Group", "Member Type",
      "Membership Policy", "Gender", "Age", "Branch", "Number Of Dependents", "Person With Disability",
      "Impairment Type", "Loan Officer", "Tenure Type", "Tenure", "Creation Date", "Disbursement Date",
      "Expiry Date", "Total Principal Amount", "Total Interest Amount", "Due Date", "Outstanding Fees",
      "Outstanding Penalty", "Total Outstanding Amount", "Total In Arrears", "Outstanding Principal",
      "Outstanding Interest", "Original Disbursed Amount", "Overdue Days",
    ]}
  />;
}
