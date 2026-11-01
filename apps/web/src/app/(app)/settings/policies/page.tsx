import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Policies · AIMSCAMS",
};

export default function PoliciesSettingsPage() {
  redirect("/settings/policies/membership");
}
