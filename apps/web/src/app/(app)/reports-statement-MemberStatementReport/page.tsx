import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Member statement report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Member statement report" description="Member statement report." />;
}
