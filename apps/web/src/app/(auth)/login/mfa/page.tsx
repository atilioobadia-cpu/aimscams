import type { Metadata } from "next";

import { MfaChallengeForm } from "@/components/auth/mfa-challenge-form";

export const metadata: Metadata = {
  title: "Two-step verification · AIMSCAMS",
  description: "Confirm your identity with your authenticator app.",
};

export default function MfaChallengePage() {
  return <MfaChallengeForm />;
}
