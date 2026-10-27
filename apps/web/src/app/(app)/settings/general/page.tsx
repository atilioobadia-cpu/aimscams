import type { Metadata } from "next";

import { OrganisationSettingsPage } from "@/components/settings/organisation-settings";

export const metadata: Metadata = {
  title: "General settings · AIMSCAMS",
};

export default function GeneralSettingsPage() {
  return <OrganisationSettingsPage />;
}
