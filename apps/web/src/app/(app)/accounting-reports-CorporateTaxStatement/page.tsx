import type { Metadata } from "next";

import { CorporateTaxStatementPage } from "@/components/accounting/corporate-tax-statement-page";

export const metadata: Metadata = { title: "Corporate tax statement · AIMSCAMS" };

export default function Route() {
  return <CorporateTaxStatementPage />;
}