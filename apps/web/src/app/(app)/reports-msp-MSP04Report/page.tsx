import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP04 report · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP04 Report" measures={["Borrowers", "Outstanding Amount", "Weighted Average Rate", "Nominal Rate"]} sections={[
    {title:"Loan Type and Interest Rates",rows:["Business loans","Agricultural loans","Consumer loans","Other loan types","Total"]},
  ]} />;
}
