import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Accrued interest report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Accrued interest report" description="Accrued interest report." />;
}
