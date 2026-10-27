import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Campaigns · AIMSCAMS",
};

export default function CampaignsPage() {
  return (
    <ComingSoon
      title="Campaigns"
      description="Loan and savings campaigns offered to clients."
      detail="Campaign setup, targeting and results arrive after the core modules. The entry stays visible so the navigation matches the measured reference."
    />
  );
}
