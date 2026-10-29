import type { Metadata } from "next";

import { AssetTypesPage } from "@/components/accounting/asset-types-page";

export const metadata: Metadata = {
  title: "Asset types · AIMSCAMS",
};

export default function AssetTypesRoute() {
  return <AssetTypesPage />;
}
