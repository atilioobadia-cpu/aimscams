import type { Metadata } from "next";

import { RegulatorySchedulePage } from "@/components/accounting/regulatory-schedule-page";

export const metadata: Metadata = { title: "MSP01 report · AIMSCAMS" };

export default function Route() {
  return <RegulatorySchedulePage title="MSP01 Report" sections={[
    {title:"Earning Assets",rows:["Cash and cash equivalents","Loans and advances","Investments"]},
    {title:"Non-Earning Assets",rows:["Property and equipment","Other assets"]},
    {title:"Total Assets",rows:["Total earning assets","Total non-earning assets","Total assets"]},
    {title:"Liabilities",rows:["Deposits","Borrowings","Other liabilities","Total liabilities"]},
    {title:"Equity",rows:["Paid-up capital","Reserves","Retained earnings","Total equity"]},
    {title:"Total Liabilities and Equity",rows:["Total liabilities and equity"]},
  ]} />;
}
