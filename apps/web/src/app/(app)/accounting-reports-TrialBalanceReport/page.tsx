import type { Metadata } from "next";

import { TrialBalanceReportPage } from "@/components/accounting/trial-balance-report-page";

export const metadata: Metadata = {
  title: "Trial balance · AIMSCAMS",
};

export default function TrialBalanceReportRoute() {
  return <TrialBalanceReportPage />;
}
