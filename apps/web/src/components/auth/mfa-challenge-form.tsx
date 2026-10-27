"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock3, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiRequest } from "@/lib/api";
import {
  clearPendingMfaChallenge,
  MFA_CHALLENGE_KEY,
  parsePendingMfaChallenge,
  type PendingMfaChallenge,
} from "@/lib/auth-challenge";

function formatRemaining(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function subscribeToSessionStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function sessionStorageSnapshot(): string {
  return window.sessionStorage.getItem(MFA_CHALLENGE_KEY) ?? "";
}

function serverStorageSnapshot(): string {
  return "";
}

function subscribeToNothing() {
  return () => {};
}

function clientSnapshot() {
  return true;
}

function serverSnapshot() {
  return false;
}

export function MfaChallengeForm() {
  const router = useRouter();
  const rawChallenge = useSyncExternalStore(
    subscribeToSessionStorage,
    sessionStorageSnapshot,
    serverStorageSnapshot,
  );
  const isHydrated = useSyncExternalStore(subscribeToNothing, clientSnapshot, serverSnapshot);
  const challenge = useMemo<PendingMfaChallenge | null>(
    () => parsePendingMfaChallenge(rawChallenge),
    [rawChallenge],
  );
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!challenge) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [challenge]);

  const deadline = challenge ? new Date(challenge.expiresAt).getTime() : 0;
  const remaining =
    challenge && nowMs !== null
      ? Math.max(0, Math.ceil((deadline - nowMs) / 1000))
      : null;
  const expired = remaining !== null && remaining <= 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge || submitting || expired) return;

    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setFieldError("Enter the 6-digit code shown in your authenticator app.");
      return;
    }

    setFieldError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      await apiRequest("/auth/mfa/challenge", {
        method: "POST",
        body: { challengeToken: challenge.challengeToken, code: trimmed },
      });
      clearPendingMfaChallenge();
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setFieldError(error.message);
        } else if (error.status === 423 || error.code === "ACCOUNT_LOCKED") {
          setFormError("This account is temporarily locked. Try again later.");
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError("Cannot reach the server. Check your connection and try again.");
      }
      setSubmitting(false);
    }
  }

  if (!isHydrated) {
    return (
      <AuthCard title="Two-step verification" description="Checking your sign-in…">
        <div className="flex items-center gap-2.5 fs-text text-label">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Loading your verification challenge
        </div>
      </AuthCard>
    );
  }

  if (!challenge || expired) {
    return (
      <AuthCard
        title={challenge ? "Verification expired" : "Start again"}
        description={
          challenge
            ? "This verification challenge has expired. Sign in again to receive a new one."
            : "We could not find a pending verification challenge for this browser."
        }
      >
        <div className="flex items-start gap-3 rounded-lg border border-card-border bg-subtle px-4 py-3.5">
          <Clock3 className="mt-0.5 size-4 shrink-0 text-label" aria-hidden="true" />
          <p className="fs-text leading-5 text-body">
            For security, a challenge is valid for five minutes and only once.
          </p>
        </div>
        <Button asChild className="mt-3 h-[42px] w-full rounded-[4px] fs-text font-medium">
          <Link href="/login" onClick={clearPendingMfaChallenge}>
            Return to sign in
          </Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Two-step verification"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="mfa-code" className="sr-only">
            Authenticator code
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="mfa-code"
              name="code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                if (fieldError) setFieldError(null);
              }}
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
              spellCheck={false}
              placeholder="000000"
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "mfa-code-error" : "mfa-code-hint"}
              disabled={submitting}
              className="h-[42px] rounded-[4px] border-[#9e9e9e] bg-white pl-10 pr-3 fs-text placeholder:text-muted-foreground md:fs-text"
            />
          </div>
          {fieldError ? (
            <p id="mfa-code-error" className="mt-1 fs-text leading-4 text-accent-red">
              {fieldError}
            </p>
          ) : (
            <p id="mfa-code-hint" className="mt-1 fs-text leading-4 text-label">
              Enter the 6-digit code shown in your authenticator app.
            </p>
          )}
        </div>

        {formError ? (
          <div className="mt-4">
            <FormError message={formError} />
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="mt-3 h-[42px] w-full gap-2 rounded-[4px] fs-text font-medium"
        >
          {submitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Verifying
            </>
          ) : (
            <>
              <ShieldCheck className="size-4" aria-hidden="true" />
              Verify and continue
            </>
          )}
        </Button>

      </form>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-card-border pt-3 fs-text text-label">
        <span className="flex items-center gap-1.5">
          <Clock3 className="size-3.5" aria-hidden="true" />
          Expires in {remaining === null ? "5:00" : formatRemaining(remaining)}
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Single use
        </span>
      </div>
    </AuthCard>
  );
}

