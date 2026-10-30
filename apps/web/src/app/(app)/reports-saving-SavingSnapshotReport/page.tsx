import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Saving snapshot report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Saving snapshot report" description="Saving snapshot report." />;
}
