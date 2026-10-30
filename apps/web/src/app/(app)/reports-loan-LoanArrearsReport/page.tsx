import type { Metadata } from "next";

import { GenericReportPage } from "@/components/accounting/generic-report-page";

export const metadata: Metadata = { title: "Loan arrears report · AIMSCAMS" };

export default function Route() {
  return <GenericReportPage title="Loan arrears report" description="Loan arrears report." />;
}
