import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Expense report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Expense report" description="Expense report." />;
}
