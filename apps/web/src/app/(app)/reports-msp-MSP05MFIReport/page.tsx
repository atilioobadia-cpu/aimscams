import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP05 mfireport · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP05 MFI Report" period="quarter" measures={["Amount", "Required Minimum", "Excess / Deficiency", "Liquid Asset Ratio"]} sections={[
    {title:"Available Liquid Assets",rows:["Cash in hand","Balances with banks","Short-term investments","Total available liquid assets"]},
    {title:"Short-Term Liabilities",rows:["Withdrawable deposits","Short-term borrowings","Total short-term liabilities"]},
    {title:"Required Liquidity",rows:["Minimum required","Excess / deficiency","Liquid asset ratio"]},
  ]} />;
}
