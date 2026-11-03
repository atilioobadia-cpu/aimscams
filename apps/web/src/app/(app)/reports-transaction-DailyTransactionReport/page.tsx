import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Daily transaction report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Daily Transaction Report" filename="daily-transaction-report.csv" filters={["Group", "Region", "Branch"]} columns={[
    "Transaction Id", "Transaction Date", "Transaction Type", "Product Name", "Client Name", "Account Number", "Debit", "Credit", "Reference Number", "Description", "Branch",
  ]} />;
}
