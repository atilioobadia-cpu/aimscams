import type { Metadata } from "next";

import { MemberImportWizardPage } from "@/components/import/member-import-wizard-page";

export const metadata: Metadata = {
  title: "Member import wizard · AIMSCAMS",
};

export default function MemberImportWizardRoute() {
  return <MemberImportWizardPage />;
}
