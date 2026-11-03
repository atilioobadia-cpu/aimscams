import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP03 mfireport · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP03 MFI Report" period="quarter" measures={["Borrowers", "Outstanding", "Current", "Past Due", "Write-Offs", "Provision"]} sections={[
    {title:"Sector Loan Classification",rows:["Agriculture","Trade and commerce","Manufacturing","Services","Other sectors","Total"]},
    {title:"Classification Rates",rows:["Current","1-30 days past due","31-90 days past due","91-180 days past due","Over 180 days past due"]},
  ]} />;
}
