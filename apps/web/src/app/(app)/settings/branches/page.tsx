import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Branches · AIMSCAMS",
};

export default function BranchesSettingsPage() {
  return (
    <ComingSoon
      title="Branches"
      description="The branch network and each branch's council type."
      detail="Branch codes, addresses, council type (CC, MC, DC, TC) and opening dates land here. Business rows carry the branch id, and row-level security enforces the scope."
    />
  );
}
