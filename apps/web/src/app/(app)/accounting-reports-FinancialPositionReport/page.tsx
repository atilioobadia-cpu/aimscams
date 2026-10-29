import type { Metadata } from "next";

import { FinancialPositionReportPage } from "@/components/accounting/financial-position-report-page";

export const metadata: Metadata = { title: "Financial position · AIMSCAMS" };

export default function FinancialPositionReportRoute() {
  return <FinancialPositionReportPage />;
}
