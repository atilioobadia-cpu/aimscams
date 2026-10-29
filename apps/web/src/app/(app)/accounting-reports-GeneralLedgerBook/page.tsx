import type { Metadata } from "next";

import { JournalBookPage } from "@/components/accounting/journal-book-page";

export const metadata: Metadata = { title: "General ledger book · AIMSCAMS" };

export default function GeneralLedgerBookRoute() {
  return <JournalBookPage title="General ledger book" description="All postings by account over a date range." />;
}
