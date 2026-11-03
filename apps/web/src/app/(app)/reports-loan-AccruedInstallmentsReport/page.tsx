import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Accrued installments report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage
    title="Accrued Installments Report"
    columns={["Accrued Interest Amount", "Paid Accrued Interest Amount", "Outstanding Accrued Interest Amount"]}
    filename="accrued-installments-report.csv"
  />;
}
