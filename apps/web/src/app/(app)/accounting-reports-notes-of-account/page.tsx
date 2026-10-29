import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "notes of account · AIMSCAMS",
};

export default function Page() {
  return (
    <ComingSoon
      title="notes of account"
      description="Financial report."
      detail="This report arrives with the financial report engine. It will read posted ledger data only."
    />
  );
}
