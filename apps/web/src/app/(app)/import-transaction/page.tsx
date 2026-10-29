import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Transaction import batches · AIMSCAMS",
};

export default function Page() {
  return (
    <ComingSoon
      title="Transaction import batches"
      description="Track transaction import batches."
      detail="This import module arrives with the import phase. It will read and validate files before applying them."
    />
  );
}
