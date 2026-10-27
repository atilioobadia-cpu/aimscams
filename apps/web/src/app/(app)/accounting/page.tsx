import type { Metadata } from "next";
import Link from "next/link";

import { ComingSoon } from "@/components/shell/coming-soon";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Accounting · AIMSCAMS",
};

export default function AccountingPage() {
  return (
    <ComingSoon
      title="Accounting"
      description="Journals, the general ledger and the trial balance."
      detail="Manual journals and the postable ledger lists arrive with the accounting module. The seeded chart of accounts and the trial balance are already live."
      actions={
        <Button
          asChild
          className="h-[var(--control-height)] px-[var(--space-14)] font-semibold"
        >
          <Link href="/accounting-chart-of-accounts">Chart of accounts</Link>
        </Button>
      }
    />
  );
}
