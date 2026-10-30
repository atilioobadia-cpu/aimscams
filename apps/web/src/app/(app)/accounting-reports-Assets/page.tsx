import type { Metadata } from "next";

import { AssetsReportPage } from "@/components/accounting/assets-report-page";

export const metadata: Metadata = { title: "Assets report · AIMSCAMS" };

export default function Route() {
  return <AssetsReportPage />;
}