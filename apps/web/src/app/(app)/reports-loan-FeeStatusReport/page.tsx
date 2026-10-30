import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Fee status report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Fee status report" description="Fee status report." />;
}
