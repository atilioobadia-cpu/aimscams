import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Accrued interest report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage
    title="Accrued Interest Report"
    columns={["Outstanding Accrued Interest Amount", "Outstanding Principal Amount", "Outstanding Interest Amount"]}
    filename="accrued-interest-report.csv"
  />;
}
