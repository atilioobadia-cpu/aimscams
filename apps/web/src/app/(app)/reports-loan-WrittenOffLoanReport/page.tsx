import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Written off loan report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Written off loan report" description="Written off loan report." />;
}
