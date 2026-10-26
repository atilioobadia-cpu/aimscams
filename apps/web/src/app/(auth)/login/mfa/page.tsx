import type { Metadata } from "next";

import { MfaChallengeForm } from "@/components/auth/mfa-challenge-form";

export const metadata: Metadata = {
  title: "Two-step verification · AIMSCAMS",
  description: "Confirm your identity with an authenticator or recovery code.",
};

export default function MfaChallengePage() {
  return <MfaChallengeForm />;
}
