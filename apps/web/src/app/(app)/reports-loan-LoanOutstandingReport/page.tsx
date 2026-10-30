import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Loan outstanding report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Loan outstanding report" description="Loan outstanding report." />;
}
