import type { Metadata } from "next";

import { LoanOperationalReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Client list report · AIMSCAMS" };

export default function Route() {
  return <LoanOperationalReportPage title="Client List Report" filename="client-list-report.csv" dateMode="none" filters={["Status", "Branch", "Group", "Region"]} columns={[
    "Member Id", "Client Name", "Member Type", "Status", "Phone Number", "Email Address", "Branch", "Group", "Nominee Name", "Nominee Relationship", "Nominee Phone Number",
  ]} />;
}
