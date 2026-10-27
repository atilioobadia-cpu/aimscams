import type { Metadata } from "next";

import { CreditProductPolicyEditForm } from "@/components/settings/credit-product-policy-edit-form";

export const metadata: Metadata = {
  title: "Edit credit product policy · AIMSCAMS",
};

export default async function EditCreditProductPolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreditProductPolicyEditForm id={id} />;
}
