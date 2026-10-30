import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Saving report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Saving report" description="Saving report." />;
}
