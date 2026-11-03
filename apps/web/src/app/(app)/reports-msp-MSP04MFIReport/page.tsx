import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP04 mfireport · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP04 MFI Report" period="quarter" measures={["Borrowers", "Outstanding Loans", "Straight-Line Average Rate", "Straight-Line Nominal Rate", "Reducing-Balance Average Rate", "Reducing-Balance Nominal Rate"]} sections={[
    {title:"Loan Type Interest Rate Schedule",rows:["Business loans","Agricultural loans","Consumer loans","Other loan types","Total"]},
  ]} />;
}
