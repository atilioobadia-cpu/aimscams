import type { Metadata } from "next";

import { CashFlowStatementPage } from "@/components/accounting/cash-flow-statement-page";

export const metadata: Metadata = { title: "Cash flow statement · AIMSCAMS" };

export default function CashFlowStatementRoute() {
  return <CashFlowStatementPage />;
}
