import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MfaEnrollForm } from "@/components/auth/mfa-enroll-form";
import { getServerAuthUser } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Set up two-step verification · AIMSCAMS",
  description: "Protect your AIMSCAMS account with an authenticator app.",
};

export default async function MfaEnrollPage() {
  const user = await getServerAuthUser();
  if (!user) redirect("/login");
  if (user.mfaEnabled) redirect("/dashboard");

  return (
    <MfaEnrollForm
      email={user.email}
      requiresEnrollment={user.mfaEnrollmentRequired}
    />
  );
}
