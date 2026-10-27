import type { Metadata } from "next";

import { LoanProductDetail } from "@/components/settings/loan-product-detail";

export const metadata: Metadata = {
  title: "Loan product · AIMSCAMS",
};

export default async function LoanProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LoanProductDetail id={id} />;
}
