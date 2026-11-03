import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP08 report · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP08 Report" measures={["Amount", "Ratio"]} sections={[
    {title:"Available Liquid Assets",rows:["Cash","Balances with banks","Treasury instruments","Other liquid assets","Total liquid assets"]},
    {title:"Short-Term Liabilities",rows:["Withdrawable deposits","Short-term obligations","Total short-term liabilities"]},
    {title:"Liquidity Requirement",rows:["Regulatory minimum","Excess / deficiency","Minimum liquidity ratio","PEARLS ratio"]},
  ]} />;
}
