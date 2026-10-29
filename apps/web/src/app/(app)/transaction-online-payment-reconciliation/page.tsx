import type { Metadata } from "next";

import { ReconciliationWorkspacePage } from "@/components/transactions/reconciliation-workspace-page";

export const metadata: Metadata = {
  title: "Reconciliation workspace · AIMSCAMS",
};

export default function ReconciliationRoute() {
  return <ReconciliationWorkspacePage />;
}
