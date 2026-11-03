import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP03 type1 report · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP03 Type 1 Report" period="quarter" measures={["Borrowers", "Outstanding", "Current", "Past Due", "Write-Offs", "Provisions", "Collateral", "Net Total"]} sections={[
    {title:"Sector and Sub-Sector Classification",rows:["Agriculture","Trade and commerce","Manufacturing","Services","Other sectors","Subtotal","Grand Total"]},
    {title:"Classification Rate Appendix",rows:["Current","1-30 days","31-90 days","91-180 days","Over 180 days"]},
  ]} />;
}
