import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP07 report · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP07 Report" measures={["Female Borrowers ≤35", "Male Borrowers ≤35", "Female Borrowers >35", "Male Borrowers >35", "Loans", "Outstanding Amount"]} sections={[
    {title:"Geographic Distribution",rows:["Region","District","Ward","Village / Street","Total"]},
    {title:"Validation and Council Categories",rows:["Branch count","Employee count","Council category"]},
  ]} />;
}
