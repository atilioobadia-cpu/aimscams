import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Deferred interest report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Deferred interest report" description="Deferred interest report." />;
}
