import type { Metadata } from "next";

import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Services · AIMSCAMS",
};

export default function ServicesSettingsPage() {
  redirect("/settings-service-provider");
}
