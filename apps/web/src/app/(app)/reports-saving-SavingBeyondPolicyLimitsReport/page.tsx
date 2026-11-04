import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Saving beyond policy limits report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage catalogFilters="savings" title="Saving Beyond Policy Limits Report" filename="saving-beyond-policy-limits-report.csv" filters={["Branch", "Region"]} columns={[
    "Member Id", "Member Name", "Account Number", "Product", "Policy Limit", "Available Balance", "Excess Amount", "Branch", "Region",
  ]} />;
}
