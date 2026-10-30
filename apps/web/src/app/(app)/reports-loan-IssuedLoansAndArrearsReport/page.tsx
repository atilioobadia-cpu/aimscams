import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Issued loans and arrears report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Issued loans and arrears report" description="Issued loans and arrears report." />;
}
