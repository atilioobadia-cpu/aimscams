import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP06 report · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP06 Report" measures={["Number of Loans", "Loan Amount", "Savings / Deposits", "Voluntary Shares"]} sections={[
    {title:"Related-Party Lending",rows:["Directors","Senior management","Staff","Related entities","Total"]},
  ]} />;
}
