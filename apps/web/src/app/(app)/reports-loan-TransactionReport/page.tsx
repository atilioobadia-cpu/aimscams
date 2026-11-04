import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Transaction report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters title="Loan Transaction Report" filename="loan-transaction-report.csv" columns={[
    "Transaction Id", "Transaction Time", "Transaction Type", "Product Name", "Client Name", "Transaction Amount", "Cheque Number", "Receipt Number", "Transaction Reference", "Phone Number",
  ]} />;
}
