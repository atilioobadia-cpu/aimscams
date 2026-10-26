"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock3, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
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

type MfaMode = "totp" | "recovery";

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
  const [mode, setMode] = useState<MfaMode>("totp");
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

  function startOver() {
    clearPendingMfaChallenge();
    router.replace("/login");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge || submitting || expired) return;

    const trimmed = code.trim();
    if (!trimmed) {
      setFieldError(
        mode === "totp" ? "Enter your authentication code." : "Enter one recovery code.",
      );
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
        <div className="flex items-center gap-2.5 text-[13px] text-label">
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
          <p className="text-[13px] leading-5 text-body">
            For security, a challenge is valid for five minutes and only once.
          </p>
        </div>
        <Button asChild className="mt-6 h-11 w-full text-[15px] font-semibold">
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
      description="Confirm it is you before we open the back office."
      footer={
        <p className="text-[12px] leading-5 text-label">
          Lost your authenticator? Use one of the recovery codes you saved when you
          enrolled, or contact your institution administrator.
        </p>
      }
    >
      <div className="mb-5 flex items-center gap-3 rounded-lg border border-card-border bg-subtle px-3.5 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-teal-bg text-brand">
          <Mail className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-label">
            Signing in as
          </p>
          <p className="mt-0.5 truncate text-[13px] font-medium text-strong">
            {challenge.email}
          </p>
        </div>
        <button
          type="button"
          onClick={startOver}
          className="shrink-0 rounded-md px-1.5 py-1 text-[12px] font-medium text-brand outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          Start over
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label
            htmlFor="mfa-code"
            className="mb-1.5 block text-[13px] font-medium text-body"
          >
            {mode === "totp" ? "Authenticator code" : "Recovery code"}
          </label>
          <Input
            id="mfa-code"
            name="code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              if (fieldError) setFieldError(null);
            }}
            autoFocus
            autoComplete="one-time-code"
            inputMode={mode === "totp" ? "numeric" : "text"}
            autoCapitalize={mode === "recovery" ? "characters" : "none"}
            spellCheck={false}
            maxLength={32}
            placeholder={mode === "totp" ? "000000" : "XXXX-XXXX-XXXX-XXXX"}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? "mfa-code-error" : "mfa-code-hint"}
            disabled={submitting}
            className="h-12 px-3.5 text-[19px] font-semibold tracking-[0.16em]"
          />
          {fieldError ? (
            <p id="mfa-code-error" className="mt-1.5 text-[12px] leading-5 text-accent-red">
              {fieldError}
            </p>
          ) : (
            <p id="mfa-code-hint" className="mt-1.5 text-[12px] leading-5 text-label">
              {mode === "totp"
                ? "Enter the 6-digit code shown in your authenticator app."
                : "Enter one of the single-use recovery codes you saved."}
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
          className="mt-6 h-11 w-full gap-2 text-[15px] font-semibold"
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

        <button
          type="button"
          onClick={() => {
            setMode((current) => (current === "totp" ? "recovery" : "totp"));
            setCode("");
            setFieldError(null);
            setFormError(null);
          }}
          className="mt-3 w-full rounded-md py-1 text-center text-[12px] font-medium text-brand outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          {mode === "totp"
            ? "Use a recovery code instead"
            : "Use an authenticator code instead"}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-card-border pt-4 text-[12px] text-label">
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
