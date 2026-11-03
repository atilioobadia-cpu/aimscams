import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Member statement report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Member Statement Report" filename="member-statement-report.csv" queryField={{label:"Member identifier", placeholder:"Enter member identifier"}} columns={[
    "Transaction Date", "Transaction Id", "Product", "Description", "Debit", "Credit", "Balance", "Reference Number",
  ]} />;
}
