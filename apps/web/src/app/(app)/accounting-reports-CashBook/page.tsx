import type { Metadata } from "next";

import { CashBookPage } from "@/components/accounting/cash-book-page";

export const metadata: Metadata = { title: "Cash book · AIMSCAMS" };

export default function CashBookRoute() {
  return <CashBookPage />;
}
