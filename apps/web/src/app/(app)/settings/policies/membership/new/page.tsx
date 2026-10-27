import type { Metadata } from "next";

import { MembershipPolicyFormPage } from "@/components/settings/membership-policy-form";

export const metadata: Metadata = {
  title: "Create membership policy · AIMSCAMS",
};

export default function CreateMembershipPolicyPage() {
  return <MembershipPolicyFormPage mode="create" />;
}
