import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Account statement report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Account Statement Report" filename="account-statement-report.csv" filters={["Account"]} columns={[
    "Transaction Date", "Transaction Id", "Description", "Debit", "Credit", "Balance", "Reference Number",
  ]} />;
}
