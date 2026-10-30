import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Risk classification of assets · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Risk classification of assets" description="Risk classification of assets." />;
}
