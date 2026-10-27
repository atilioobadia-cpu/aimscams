import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Import · AIMSCAMS",
};

export default function ImportPage() {
  return (
    <ComingSoon
      title="Import"
      description="Bulk import of clients, accounts and opening balances."
      detail="Column mapping, validation and the dry-run preview arrive with the import module. A file is never applied without a validated preview."
    />
  );
}
