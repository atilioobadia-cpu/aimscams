import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP09 mfireport · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP09 MFI Report" period="quarter" measures={["Female Loans", "Female Amount", "Male Loans", "Male Amount", "Total Loans", "Total Amount"]} sections={[
    {title:"Sector Loan Disbursements",rows:["Agriculture","Trade and commerce","Manufacturing","Services","Other sectors","Total"]},
  ]} />;
}
