import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Client list report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Client list report" description="Client list report." />;
}
