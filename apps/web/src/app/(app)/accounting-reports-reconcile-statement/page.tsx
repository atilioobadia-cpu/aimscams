import type { Metadata } from "next";

import { ReconcileStatementPage } from "@/components/accounting/reconciliation-reports-page";

export const metadata: Metadata = { title: "Reconcile statement · AIMSCAMS" };

export default function Route() {
  return <ReconcileStatementPage />;
}