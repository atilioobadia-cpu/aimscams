import type { Metadata } from "next";

import { CreditProductPolicyDetail } from "@/components/settings/credit-product-policy-detail";

export const metadata: Metadata = {
  title: "Credit product policy · AIMSCAMS",
};

export default async function CreditProductPolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreditProductPolicyDetail id={id} />;
}
