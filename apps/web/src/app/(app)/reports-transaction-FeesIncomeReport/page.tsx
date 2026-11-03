import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Fees income report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Fees Income Report" filename="fees-income-report.csv" filters={["Branch", "Fee", "Region", "Loan Officer"]} columns={[
    "Transaction Date", "Client Name", "Loan Account", "Fee Name", "Amount", "Payment Method", "Reference Number", "Branch", "Loan Officer",
  ]} />;
}
