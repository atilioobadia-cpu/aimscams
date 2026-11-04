import type { Metadata } from "next";

import { ReportCategoryHub } from "@/components/data/report-category-hub";

export const metadata: Metadata = { title: "Saving Reports · AIMSCAMS" };

const reports = [
  {
    href: "/reports-saving-SavingBeyondPolicyLimitsReport",
    title: "Saving Beyond Policy Limits Report",
    description: "This report lists saving accounts that exceed configured policy limits, with member and account details.",
  },
  {
    href: "/reports-saving-SavingReport",
    title: "Saving Report",
    description: "This report summarizes saving account balances, activity and status over the selected period.",
  },
  {
    href: "/reports-saving-SavingSnapshotReport",
    title: "Saving Snapshot Report",
    description: "This report provides a point-in-time snapshot of saving account balances and status.",
  },
];

export default function SavingReportsPage() {
  return <ReportCategoryHub title="Saving Reports" reports={reports} />;
}
