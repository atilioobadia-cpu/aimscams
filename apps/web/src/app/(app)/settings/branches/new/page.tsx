import type { Metadata } from "next";

import { BranchFormPage } from "@/components/settings/branch-form";

export const metadata: Metadata = {
  title: "Add branch · AIMSCAMS",
};

export default function NewBranchPage() {
  return <BranchFormPage mode="create" />;
}
