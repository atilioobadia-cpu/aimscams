import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Pending loan applications · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Pending Loan Applications" filename="pending-loan-applications.csv" dateMode="as-of" columns={[
    "Application Number", "Client Name", "Loan Product", "Loan Officer", "Branch", "Application Status", "Loan Status", "Application Stage Type", "Debt Capacity", "Description",
  ]} />;
}
