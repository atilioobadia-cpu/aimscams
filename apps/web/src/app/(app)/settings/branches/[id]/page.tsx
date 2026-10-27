import type { Metadata } from "next";

import { BranchFormPage } from "@/components/settings/branch-form";

export const metadata: Metadata = {
  title: "Branch · AIMSCAMS",
};

export default async function BranchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BranchFormPage mode="edit" branchId={id} />;
}
