import type { Metadata } from "next";

import { ReconciliationPage } from "@/components/accounting/reconciliation-reports-page";

export const metadata: Metadata = { title: "Reconciliation · AIMSCAMS" };

export default function Route() {
  return <ReconciliationPage />;
}