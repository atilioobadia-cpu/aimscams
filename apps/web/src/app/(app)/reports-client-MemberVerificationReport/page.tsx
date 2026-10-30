import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Member verification report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Member verification report" description="Member verification report." />;
}
