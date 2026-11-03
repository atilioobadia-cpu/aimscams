import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Expense report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Expense Report" filename="expense-report.csv" filters={["Branch", "Region"]} columns={[
    "Payment Date", "Amount", "Comment", "Cheque Number", "Receipt Number", "Transaction Reference", "Branch", "Region",
  ]} />;
}
