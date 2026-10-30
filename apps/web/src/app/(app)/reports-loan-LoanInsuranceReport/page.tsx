import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Loan insurance report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Loan insurance report" description="Loan insurance report." />;
}
