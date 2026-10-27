import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Policies · AIMSCAMS",
};

export default function PoliciesSettingsPage() {
  return (
    <ComingSoon
      title="Policies"
      description="Fees, penalties, arrears ageing and provisioning."
      detail="Allocation order, penalty rules and provision buckets land here as versioned policy rows. A change applies to future postings and never restates posted entries."
    />
  );
}
