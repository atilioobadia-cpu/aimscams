import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "MSP10 mfireport · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="MSP10 mfireport" description="MSP10 mfireport." />;
}
