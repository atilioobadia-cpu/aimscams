import type { Metadata } from "next";

import { FixedAssetRegisterPage } from "@/components/accounting/fixed-asset-register-page";

export const metadata: Metadata = {
  title: "Fixed asset register · AIMSCAMS",
};

export default function FixedAssetRegisterRoute() {
  return <FixedAssetRegisterPage />;
}
