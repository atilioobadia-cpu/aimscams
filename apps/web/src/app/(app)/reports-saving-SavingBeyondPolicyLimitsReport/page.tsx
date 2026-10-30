import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Saving beyond policy limits report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Saving beyond policy limits report" description="Saving beyond policy limits report." />;
}
