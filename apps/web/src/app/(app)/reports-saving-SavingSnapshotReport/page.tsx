import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Saving snapshot report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Saving Snapshot Report" filename="saving-snapshot-report.csv" dateMode="as-of" filters={["Product", "Manager", "Branch", "Group", "Region"]} columns={[
    "Member Id", "Member Name", "Member Type", "Product", "Manager", "Branch", "Opening Balance", "Available Balance", "Reserved Balance", "Total Balance",
  ]} />;
}
