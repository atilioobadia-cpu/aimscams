import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Products · AIMSCAMS",
};

export default function ProductsSettingsPage() {
  return (
    <ComingSoon
      title="Products"
      description="Savings and loan product terms."
      detail="Interest method, term limits, fees and repayment frequency land here. Accounts snapshot their product terms at opening, so a later change never rewrites history."
    />
  );
}
