import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Accrued installments report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Accrued installments report" description="Accrued installments report." />;
}
