import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Pending loan applications · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Pending loan applications" description="Pending loan applications." />;
}
