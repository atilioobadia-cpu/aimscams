import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Written off loan report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters title="Written Off Loan Report" filename="written-off-loan-report.csv" columns={[
    "Account Number", "Client Name", "Loan Product", "Branch", "Group", "Loan Date", "Write Off Date", "Write Off Reason", "Initiator", "Recovered Amount From Principal",
  ]} />;
}
