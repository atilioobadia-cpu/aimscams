import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "General settings · AIMSCAMS",
};

export default function GeneralSettingsPage() {
  return (
    <ComingSoon
      title="General"
      description="Institution profile, branding and working preferences."
      detail="Legal name, registration number, logo, time zone and default branch land here. One installation serves one institution, so these values identify the tenant."
    />
  );
}
