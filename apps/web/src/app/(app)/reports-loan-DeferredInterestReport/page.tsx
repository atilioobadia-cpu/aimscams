import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Deferred interest report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Deferred Interest Report" filename="deferred-interest-report.csv" dateMode="as-of" columns={[
    "Account Number", "Client Name", "Loan Product", "Loan Officer", "Branch", "Group",
    "Total Outstanding Principal", "Total Outstanding Interest", "Total Outstanding Charges",
  ]} />;
}
