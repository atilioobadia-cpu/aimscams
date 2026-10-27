"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";

import { AuthCard } from "@/components/auth/auth-card";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiRequest } from "@/lib/api";
import type { MfaEnrollment, MfaStatus } from "@/lib/auth-types";

type Phase = "loading" | "intro" | "setup" | "recovery";

function formatSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret;
}

export function MfaEnrollForm({
  email,
  requiresEnrollment,
}: {
  email: string;
  requiresEnrollment: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [pendingEnrollment, setPendingEnrollment] = useState(false);
  const [enrollment, setEnrollment] = useState<MfaEnrollment | null>(null);
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"secret" | "codes" | null>(null);
  const [codesSaved, setCodesSaved] = useState(false);

  useEffect(() => {
    let active = true;

    apiRequest<MfaStatus>("/auth/mfa/status")
      .then((status) => {
        if (!active) return;
        if (status.enabled) {
          router.replace("/dashboard");
          return;
        }
        setPendingEnrollment(status.pending);
        setPhase("intro");
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }
        setFormError("Cannot reach the server. Check your connection and try again.");
        setPhase("intro");
      });

    return () => {
      active = false;
    };
  }, [router]);

  async function copyValue(value: string, key: "secret" | "codes") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
    } catch {
      setFormError("Copy failed. Select the text and copy it manually.");
    }
  }

  async function startEnrollment() {
    setBusy(true);
    setFieldError(null);
    setFormError(null);
    setCopied(null);
    setCodesSaved(false);

    try {
      const result = await apiRequest<MfaEnrollment>("/auth/mfa/enroll", {
        method: "POST",
      });
      setEnrollment(result);
      setPendingEnrollment(false);
      setCode("");
      setPhase("setup");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        router.replace("/dashboard");
        return;
      }
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Cannot reach the server. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setFieldError("Enter the 6-digit code shown in your authenticator app.");
      return;
    }

    setBusy(true);
    setFieldError(null);
    setFormError(null);

    try {
      await apiRequest("/auth/mfa/activate", {
        method: "POST",
        body: { code: trimmed },
      });
      setPhase("recovery");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFieldError(error.message);
      } else if (error instanceof ApiError && error.status === 409) {
        router.replace("/dashboard");
      } else {
        setFormError(
          error instanceof ApiError
            ? error.message
            : "Cannot reach the server. Check your connection and try again.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  if (phase === "loading") {
    return (
      <AuthCard
        title="Set up two-step verification"
        description="Protecting your account with an authenticator app."
      >
        <div className="flex items-center gap-2.5 text-fs text-label">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Checking your verification settings
        </div>
      </AuthCard>
    );
  }

  if (phase === "recovery") {
    const recoveryCodes = enrollment?.recoveryCodes ?? [];
    return (
      <AuthCard
        title="Save your recovery codes"
        description="These are the only codes that can get you back in if you lose your authenticator."
        footer={
          <p className="text-fs leading-5 text-label">
            Store them somewhere safe and separate from your phone. Each code works once.
          </p>
        }
      >
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-card-border bg-accent-yellow-bg px-4 py-3.5">
          <KeyRound className="mt-0.5 size-4 shrink-0 text-accent-yellow" aria-hidden="true" />
          <p className="text-fs leading-5 text-body">
            This is the only time these codes are shown. We cannot recover them for you.
          </p>
        </div>

        <div className="rounded-lg border border-card-border bg-subtle p-4">
          <ol className="grid grid-cols-2 gap-x-5 gap-y-2 font-mono text-fs font-medium tracking-wide text-strong">
            {recoveryCodes.map((recoveryCode) => (
              <li key={recoveryCode}>{recoveryCode}</li>
            ))}
          </ol>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void copyValue(recoveryCodes.join("\n"), "codes")}
          className="mt-3 h-10 w-full gap-2 text-fs"
        >
          {copied === "codes" ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied === "codes" ? "Copied all codes" : "Copy all codes"}
        </Button>

        {formError ? (
          <div className="mt-4">
            <FormError message={formError} />
          </div>
        ) : null}

        <label className="mt-5 flex cursor-pointer items-start gap-3 text-fs leading-5 text-body">
          <input
            type="checkbox"
            checked={codesSaved}
            onChange={(event) => setCodesSaved(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-input accent-[var(--brand-primary)]"
          />
          I have saved these recovery codes somewhere safe.
        </label>

        <Button
          type="button"
          disabled={!codesSaved}
          onClick={() => {
            router.replace("/dashboard");
            router.refresh();
          }}
          className="mt-6 h-11 w-full gap-2 text-fs font-semibold"
        >
          Continue to dashboard
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </AuthCard>
    );
  }

  if (phase === "setup" && enrollment) {
    return (
      <AuthCard
        title="Scan and verify"
        description="Add AIMSCAMS to your authenticator app, then enter the six-digit code it shows."
        footer={
          <p className="text-fs leading-5 text-label">
            Setting up for <span className="font-medium text-body">{email}</span>
          </p>
        }
      >
        <div className="flex items-center gap-2 text-fs font-medium uppercase tracking-[0.12em] text-label">
          <Smartphone className="size-4 text-brand" aria-hidden="true" />
          Step 1 of 2
        </div>

        <div className="mt-3 flex justify-center rounded-xl border border-card-border bg-surface p-4">
          <QRCodeSVG
            value={enrollment.otpauthUri}
            size={164}
            level="M"
            marginSize={1}
            bgColor="#ffffff"
            fgColor="#0f172a"
            aria-label="QR code for authenticator setup"
          />
        </div>

        <div className="mt-4 rounded-lg border border-card-border bg-subtle px-3.5 py-3">
          <p className="text-fs font-medium uppercase tracking-[0.12em] text-label">
            Cannot scan? Enter this key
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all font-mono text-fs font-semibold tracking-wide text-strong">
              {formatSecret(enrollment.secret)}
            </code>
            <button
              type="button"
              onClick={() => void copyValue(enrollment.secret, "secret")}
              className="grid size-8 shrink-0 place-items-center rounded-md text-brand outline-none transition-colors hover:bg-accent-teal-bg focus-visible:ring-3 focus-visible:ring-ring/30"
              aria-label="Copy setup key"
            >
              {copied === "secret" ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <form onSubmit={activate} noValidate className="mt-5">
          <div className="mb-2 flex items-center gap-2 text-fs font-medium uppercase tracking-[0.12em] text-label">
            <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
            Step 2 of 2
          </div>
          <label htmlFor="enroll-code" className="mb-1.5 block text-fs font-medium text-body">
            Authentication code
          </label>
          <Input
            id="enroll-code"
            name="code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
              if (fieldError) setFieldError(null);
            }}
            autoFocus
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? "enroll-code-error" : undefined}
            disabled={busy}
            className="h-12 px-3.5 text-center text-fs font-semibold tracking-[0.2em]"
          />
          {fieldError ? (
            <p id="enroll-code-error" className="mt-1.5 text-fs leading-5 text-accent-red">
              {fieldError}
            </p>
          ) : null}

          {formError ? (
            <div className="mt-4">
              <FormError message={formError} />
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={busy}
            aria-busy={busy}
            className="mt-5 h-11 w-full gap-2 text-fs font-semibold"
          >
            {busy ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                Verifying
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" aria-hidden="true" />
                Verify and turn on
              </>
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => void startEnrollment()}
          disabled={busy}
          className="mt-3 w-full rounded-md py-1 text-center text-fs font-medium text-brand outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50"
        >
          Restart setup
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set up two-step verification"
      description="Use an authenticator app to confirm it is you when you sign in."
      footer={
        <p className="text-fs leading-5 text-label">
          Setting up for <span className="font-medium text-body">{email}</span>
        </p>
      }
    >
      {requiresEnrollment ? (
        <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-card-border bg-subtle px-3.5 py-3">
          <ShieldCheck className="size-4 shrink-0 text-brand" aria-hidden="true" />
          <p className="text-fs leading-5 text-body">
            Required for your role before you can open the back office.
          </p>
        </div>
      ) : null}

      <ul className="space-y-3.5">
        {[
          {
            icon: Smartphone,
            title: "Install an authenticator app",
            body: "Use any TOTP app, such as Google Authenticator or Microsoft Authenticator.",
          },
          {
            icon: CheckCircle2,
            title: "Scan the QR code",
            body: "We will show a QR code and a setup key you can enter by hand.",
          },
          {
            icon: KeyRound,
            title: "Keep your recovery codes",
            body: "You will get ten single-use codes in case you lose your phone.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-teal-bg text-brand">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-fs font-semibold leading-5 text-strong">{title}</p>
              <p className="mt-0.5 text-fs leading-5 text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ul>

      {pendingEnrollment ? (
        <div className="mt-5 rounded-lg border border-card-border bg-subtle px-3.5 py-3">
          <p className="text-fs leading-5 text-body">
            You started setup earlier but did not finish. Starting again replaces the previous
            QR code and recovery codes.
          </p>
        </div>
      ) : null}

      {formError ? (
        <div className="mt-4">
          <FormError message={formError} />
        </div>
      ) : null}

      <Button
        type="button"
        onClick={() => void startEnrollment()}
        disabled={busy}
        aria-busy={busy}
        className="mt-6 h-11 w-full gap-2 text-fs font-semibold"
      >
        {busy ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Preparing setup
          </>
        ) : (
          <>
            {pendingEnrollment ? "Start setup again" : "Set up authenticator app"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </AuthCard>
  );
}

