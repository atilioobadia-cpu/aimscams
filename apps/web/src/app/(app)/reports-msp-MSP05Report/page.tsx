import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP05 report · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP05 Report" measures={["Female Borrowers", "Female Amount", "Male Borrowers", "Male Amount", "Total Borrowers", "Total Amount"]} sections={[
    {title:"Sector and Sub-Sector Loan Disbursements",rows:["Agriculture","Trade and commerce","Manufacturing","Services","Other sectors","Total"]},
  ]} />;
}
