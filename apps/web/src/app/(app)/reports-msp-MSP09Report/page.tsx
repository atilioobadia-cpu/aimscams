import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP09 report · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP09 Report" measures={["Amount", "Ratio"]} sections={[
    {title:"Capital Adequacy",rows:["Core capital","Institutional capital","Net institutional capital","Total assets"]},
    {title:"Capital Ratios",rows:["Core capital to total assets","Institutional capital to total assets","Total capital adequacy ratio"]},
  ]} />;
}
