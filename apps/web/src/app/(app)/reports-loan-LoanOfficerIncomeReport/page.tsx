import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Loan officer income report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Loan officer income report" description="Loan officer income report." />;
}
