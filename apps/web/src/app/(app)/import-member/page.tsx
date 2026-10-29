import type { Metadata } from "next";

import { MemberImportBatchesPage } from "@/components/import/member-import-batches-page";

export const metadata: Metadata = {
  title: "Member import batches · AIMSCAMS",
};

export default function MemberImportBatchesRoute() {
  return <MemberImportBatchesPage />;
}
