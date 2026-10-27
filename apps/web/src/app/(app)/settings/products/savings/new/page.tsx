import type { Metadata } from "next";

import { SavingsProductFormPage } from "@/components/settings/savings-product-form";

export const metadata: Metadata = {
  title: "Create savings product · AIMSCAMS",
};

export default function CreateSavingsProductPage() {
  return <SavingsProductFormPage mode="create" />;
}
