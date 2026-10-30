import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Loan disbursement report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Loan disbursement report" description="Loan disbursement report." />;
}
