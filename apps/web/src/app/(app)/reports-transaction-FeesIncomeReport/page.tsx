import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Fees income report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Fees income report" description="Fees income report." />;
}
