import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Services · AIMSCAMS",
};

export default function ServicesSettingsPage() {
  return (
    <ComingSoon
      title="Services"
      description="Value-added services offered to clients."
      detail="Service catalogue, pricing and eligibility land here once the client and accounts modules exist. The entry stays for navigation parity with the reference."
    />
  );
}
