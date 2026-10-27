import type { Metadata } from "next";

import { BranchListPage } from "@/components/settings/branch-list";

export const metadata: Metadata = {
  title: "Branches · AIMSCAMS",
};

export default function BranchesSettingsPage() {
  return <BranchListPage />;
}
