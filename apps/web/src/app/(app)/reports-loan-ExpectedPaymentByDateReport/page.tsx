import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Expected payment by date report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Expected payment by date report" description="Expected payment by date report." />;
}
