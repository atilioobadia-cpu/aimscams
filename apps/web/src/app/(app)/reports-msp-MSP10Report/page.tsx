import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP10 report · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP10 Report" measures={["Number of Complaints"]} sections={[
    {title:"Complaints Schedule",rows:["Opening complaints","New complaints received","Resolved by institution","Resolved by other parties","Unresolved complaints","Referrals","Total"]},
  ]} />;
}
