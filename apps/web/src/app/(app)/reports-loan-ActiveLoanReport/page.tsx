import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Active loan report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Active loan report" description="Active loan report." />;
}
