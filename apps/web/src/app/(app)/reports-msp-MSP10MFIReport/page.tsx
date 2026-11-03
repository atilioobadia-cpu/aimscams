import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP10 mfireport · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP10 MFI Report" period="quarter" measures={["Female ≤35", "Male ≤35", "Female >35", "Male >35", "Loans", "Outstanding Balance", "Compulsory Savings"]} sections={[
    {title:"Geographic Distribution",rows:["Region","District","Ward","Village / Street","Total"]},
    {title:"Council Categories",rows:["Urban council","District council","Other category"]},
  ]} />;
}
