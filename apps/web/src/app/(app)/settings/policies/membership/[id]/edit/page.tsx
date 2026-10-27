import type { Metadata } from "next";

import { MembershipPolicyFormPage } from "@/components/settings/membership-policy-form";

export const metadata: Metadata = {
  title: "Edit membership policy · AIMSCAMS",
};

export default async function EditMembershipPolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MembershipPolicyFormPage mode="edit" policyId={id} />;
}
