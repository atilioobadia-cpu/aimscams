import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "MSP04 mfireport · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="MSP04 mfireport" description="MSP04 mfireport." />;
}
