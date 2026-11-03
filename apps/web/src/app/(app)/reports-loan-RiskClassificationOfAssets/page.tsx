import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Risk classification of assets · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Risk Classification Of Assets" filename="risk-classification-of-assets.csv" dateMode="as-of" columns={[
    "Loan Product", "Account Number", "Client Name", "Interest Rate", "Calculation Method", "Performance Classification", "Rescheduled Loan Status",
  ]} />;
}
