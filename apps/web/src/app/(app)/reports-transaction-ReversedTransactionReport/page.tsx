import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Reversed transaction report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Reversed Transaction Report" filename="reversed-transaction-report.csv" filters={["Reversal User", "Branch", "Group", "Region"]} columns={[
    "Transaction Id", "Transaction Date", "Reversal Date", "Reversal User", "Transaction Type", "Client Name", "Account Number", "Amount", "Reason", "Reference Number",
  ]} />;
}
