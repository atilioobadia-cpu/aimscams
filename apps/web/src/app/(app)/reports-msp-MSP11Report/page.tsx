import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP11 report · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP11 Report" measures={["Deposits", "Loans", "Total Exposure"]} sections={[
    {title:"Aggregate Exposure",rows:["Total deposits with financial institutions","Total loans from financial institutions","Total exposure"]},
    {title:"Financial Institution Details",rows:["Institution name","Deposits","Loans","Total exposure"]},
  ]} />;
}
