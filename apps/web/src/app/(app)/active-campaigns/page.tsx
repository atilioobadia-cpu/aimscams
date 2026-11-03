import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Active Campaigns · AIMSCAMS",
};

export default function ActiveCampaignsPage() {
  return (
    <ComingSoon
      title="Active Campaigns"
      description="View campaigns currently offered to clients."
      detail="Campaign activation and results are not available in local data yet."
    />
  );
}
