import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Guarantors report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Guarantors report" description="Guarantors report." />;
}
