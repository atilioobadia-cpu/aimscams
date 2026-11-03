import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP02 report · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP02 Report" measures={["Month To Date", "Previous Month"]} sections={[
    {title:"Interest Income",rows:["Interest on loans","Other interest income","Total interest income"]},
    {title:"Non-Interest Income",rows:["Fees and commissions","Other operating income","Total non-interest income"]},
    {title:"Expenses and Provisions",rows:["Interest expense","Operating expenses","Loan loss provisions","Total expenses"]},
    {title:"Net Income",rows:["Income before tax","Tax","Net income"]},
  ]} />;
}
