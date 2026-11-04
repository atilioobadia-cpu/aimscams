import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Loan officer income report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters title="Loan Officer Income Report" filename="loan-officer-income-report.csv" dateMode="as-of" columns={[
    "Loan Officer", "Ledger Name", "Account Code", "Membership Policy", "Income",
  ]} />;
}
