import type { Metadata } from "next";

import { SavingsProductFormPage } from "@/components/settings/savings-product-form";

export const metadata: Metadata = {
  title: "Edit savings product · AIMSCAMS",
};

export default async function EditSavingsProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SavingsProductFormPage mode="edit" productId={id} />;
}
