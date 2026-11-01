import type { Metadata } from "next";

import { ReportCategoryHub } from "@/components/data/report-category-hub";

export const metadata: Metadata = { title: "Saving Reports · AIMSCAMS" };

const reports = [
  { href: "/reports-saving-SavingReport", title: "Saving Report" },
  { href: "/reports-saving-SavingSnapshotReport", title: "Saving Snapshot Report" },
  { href: "/reports-saving-SavingBeyondPolicyLimitsReport", title: "Saving Beyond Policy Limits Report" },
];

export default function SavingReportsPage() {
  return <ReportCategoryHub title="Saving Reports" reports={reports} />;
}
