import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Accounts · AIMSCAMS",
};

export default function AccountsPage() {
  return (
    <ComingSoon
      title="Accounts"
      description="Savings, shares and loan accounts held by clients."
      detail="Account opening, product terms, balances and statements arrive with the accounts module. Until then no account can be opened from this screen."
    />
  );
}
