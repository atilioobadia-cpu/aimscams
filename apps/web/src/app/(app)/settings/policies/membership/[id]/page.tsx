import type { Metadata } from "next";

import { MembershipPolicyDetail } from "@/components/settings/membership-policy-detail";

export const metadata: Metadata = {
  title: "Membership policy · AIMSCAMS",
};

export default async function MembershipPolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MembershipPolicyDetail id={id} />;
}
