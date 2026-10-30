import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Account statement report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Account statement report" description="Account statement report." />;
}
