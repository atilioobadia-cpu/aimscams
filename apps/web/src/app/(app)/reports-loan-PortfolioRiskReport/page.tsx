import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Portfolio risk report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Portfolio risk report" description="Portfolio risk report." />;
}
