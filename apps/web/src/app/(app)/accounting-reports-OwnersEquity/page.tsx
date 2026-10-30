import type { Metadata } from "next";

import { OwnersEquityReportPage } from "@/components/accounting/owners-equity-report-page";

export const metadata: Metadata = { title: "Owners equity · AIMSCAMS" };

export default function Route() {
  return <OwnersEquityReportPage />;
}