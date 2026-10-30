import type { Metadata } from "next";

import { ComprehensiveTrialBalancePage } from "@/components/accounting/comprehensive-trial-balance-page";

export const metadata: Metadata = { title: "Comprehensive trial balance · AIMSCAMS" };

export default function Route() {
  return <ComprehensiveTrialBalancePage />;
}