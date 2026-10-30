import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Reversed transaction report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Reversed transaction report" description="Reversed transaction report." />;
}
