import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Fee status report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters title="Fee Status Report" filename="fee-status-report.csv" columns={[
    "Account Number", "Client Name", "Loan Product", "Charge", "Outstanding Fee", "Status", "Due Date", "Payment Date", "Overdue Days",
  ]} />;
}
