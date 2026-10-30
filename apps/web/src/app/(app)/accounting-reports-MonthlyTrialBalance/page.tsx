import type { Metadata } from "next";

import { MonthlyTrialBalancePage } from "@/components/accounting/monthly-trial-balance-page";

export const metadata: Metadata = { title: "Monthly trial balance · AIMSCAMS" };

export default function Route() {
  return <MonthlyTrialBalancePage />;
}