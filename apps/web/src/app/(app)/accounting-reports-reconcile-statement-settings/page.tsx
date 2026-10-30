import type { Metadata } from "next";

import { ReconcileStatementSettingsPage } from "@/components/accounting/reconciliation-reports-page";

export const metadata: Metadata = { title: "Reconcile statement settings · AIMSCAMS" };

export default function Route() {
  return <ReconcileStatementSettingsPage />;
}