import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Auto Debit · AIMSCAMS",
};

export default function AutoDebitSettingsPage() {
  return (
    <ComingSoon
      title="Auto Debit"
      description="Automatic debit settings for eligible accounts."
      detail="The local settings model does not yet support Auto Debit configuration."
    />
  );
}
