import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password · AIMSCAMS",
  description: "Request or complete a password reset for your AIMSCAMS account.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token =
    typeof params.token === "string" && params.token.trim() ? params.token.trim() : undefined;

  return <ForgotPasswordForm token={token} />;
}
