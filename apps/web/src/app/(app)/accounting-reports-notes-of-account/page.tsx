import type { Metadata } from "next";

import { NotesOfAccountPage } from "@/components/accounting/reconciliation-reports-page";

export const metadata: Metadata = { title: "Notes of account · AIMSCAMS" };

export default function Route() {
  return <NotesOfAccountPage />;
}