import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Transaction report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Transaction report" description="Transaction report." />;
}
