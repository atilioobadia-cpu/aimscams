import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Clients · AIMSCAMS",
};

export default function ClientsPage() {
  return (
    <ComingSoon
      title="Clients"
      description="Members, borrowers and groups registered at this branch."
      detail="Registration, KYC documents, group membership and the per-client ledger arrive with the client module. Nothing is collected here yet, so no partial records can be created."
    />
  );
}
