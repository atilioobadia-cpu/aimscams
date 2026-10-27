import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Accounting settings · AIMSCAMS",
};

export default function AccountingSettingsPage() {
  return (
    <ComingSoon
      title="Accounting"
      description="Financial year, posting rules and account mapping."
      detail="Period locks, the repayment policy row and account mapping for fees, penalties and provisioning land here. Posted entries stay immutable; corrections are reversing entries."
    />
  );
}
