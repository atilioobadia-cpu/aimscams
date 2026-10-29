import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Account import batches · AIMSCAMS",
};

export default function Page() {
  return (
    <ComingSoon
      title="Account import batches"
      description="Track account import batches."
      detail="This import module arrives with the import phase. It will read and validate files before applying them."
    />
  );
}
