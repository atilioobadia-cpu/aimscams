import type { Metadata } from "next";

import { JournalBookPage } from "@/components/accounting/journal-book-page";

export const metadata: Metadata = { title: "Journal book · AIMSCAMS" };

export default function JournalBookRoute() {
  return <JournalBookPage title="Journal book" description="All journal entries in date order." />;
}
