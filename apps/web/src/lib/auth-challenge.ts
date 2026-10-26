export const MFA_CHALLENGE_KEY = "aimscams.mfa.challenge";

export type PendingMfaChallenge = {
  challengeToken: string;
  expiresAt: string;
  email: string;
};

export function parsePendingMfaChallenge(raw: string | null): PendingMfaChallenge | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingMfaChallenge>;
    if (
      typeof parsed.challengeToken !== "string" ||
      typeof parsed.expiresAt !== "string" ||
      typeof parsed.email !== "string"
    ) {
      return null;
    }
    return {
      challengeToken: parsed.challengeToken,
      expiresAt: parsed.expiresAt,
      email: parsed.email,
    };
  } catch {
    return null;
  }
}

export function readPendingMfaChallenge(): PendingMfaChallenge | null {
  if (typeof window === "undefined") return null;
  return parsePendingMfaChallenge(window.sessionStorage.getItem(MFA_CHALLENGE_KEY));
}

export function savePendingMfaChallenge(challenge: PendingMfaChallenge): void {
  window.sessionStorage.setItem(MFA_CHALLENGE_KEY, JSON.stringify(challenge));
}

export function clearPendingMfaChallenge(): void {
  window.sessionStorage.removeItem(MFA_CHALLENGE_KEY);
}
