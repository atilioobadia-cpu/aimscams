import type { Metadata } from "next";

import { LedgerStatementReportPage } from "@/components/accounting/ledger-statement-report-page";

export const metadata: Metadata = { title: "Ledger statement · AIMSCAMS" };

export default function Route() {
  return <LedgerStatementReportPage />;
}