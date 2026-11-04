import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Saving report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters="savings" title="Saving Report" filename="saving-report.csv" filters={["Manager", "Product", "Product Type", "Branch", "Region"]} columns={[
    "Member Id", "Member Name", "Product Name", "Manager", "Branch", "Transaction Count", "Opening Balance", "Debit", "Credit", "Closing Balance", "Reserved Balance",
  ]} />;
}
