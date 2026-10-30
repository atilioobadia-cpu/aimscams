"use client";

import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, LoaderCircle, Mail, User } from "lucide-react";
import { useState, type FormEvent } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { FormError } from "@/components/auth/form-error";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiRequest } from "@/lib/api";

type ResetRequestResponse = {
  requested: true;
  message: string;
  devResetUrl?: string;
};

type PasswordRequirement = {
  label: string;
  met: (password: string) => boolean;
};

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 200;

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: "At least 12 characters", met: (value) => value.length >= PASSWORD_MIN_LENGTH },
  { label: "An letter", met: (value) => /[A-Z]/.test(value) },
  { label: "A lowercase letter", met: (value) => /[a-z]/.test(value) },
  { label: "A number", met: (value) => /\d/.test(value) },
  { label: "A symbol", met: (value) => /[^A-Za-z0-9]/.test(value) },
];

const labelClass = "sr-only";
const fieldErrorClass = "mt-1 fs-text leading-4 text-accent-red";

export function ForgotPasswordForm({ token }: { token?: string }) {
  const [email, setEmail] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requesting) return;

    if (!email.trim()) {
      setEmailError("Enter your email address.");
      return;
    }

    setEmailError(null);
    setRequestError(null);
    setRequesting(true);

    try {
      const result = await apiRequest<ResetRequestResponse>(
        "/auth/password-reset/request",
        { method: "POST", body: { email: email.trim() } },
      );
      setDevResetUrl(result.devResetUrl ?? null);
      setSent(true);
    } catch (error) {
      setRequestError(
        error instanceof ApiError
          ? error.message
          : "Cannot reach the server. Check your connection and try again.",
      );
    } finally {
      setRequesting(false);
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || resetting) return;

    const missing = PASSWORD_REQUIREMENTS.filter(
      (requirement) => !requirement.met(password),
    );
    let invalid = false;
    if (missing.length > 0 || password.length > PASSWORD_MAX_LENGTH) {
      setPasswordError(
        password.length > PASSWORD_MAX_LENGTH
          ? `Use at most ${PASSWORD_MAX_LENGTH} characters.`
          : "Choose a password that meets every requirement below.",
      );
      invalid = true;
    } else {
      setPasswordError(null);
    }

    if (confirmation !== password) {
      setConfirmationError("Passwords do not match.");
      invalid = true;
    } else {
      setConfirmationError(null);
    }

    if (invalid) return;

    setResetError(null);
    setResetting(true);
    try {
      await apiRequest("/auth/password-reset/confirm", {
        method: "POST",
        body: { token, password },
      });
      setPassword("");
      setConfirmation("");
      setResetComplete(true);
    } catch (error) {
      setResetError(
        error instanceof ApiError
          ? error.message
          : "Cannot reach the server. Check your connection and try again.",
      );
    } finally {
      setResetting(false);
    }
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        description="If an account exists for that address, a password reset link has been sent."
      >
        <div className="flex items-start gap-3 rounded-lg border border-card-border bg-subtle px-4 py-3.5">
          <Mail className="mt-0.5 size-4 shrink-0 text-label" aria-hidden="true" />
          <div className="fs-text leading-5 text-body">
            <p>
              The link is valid for 30 minutes and can be used once. Check your spam folder
              if it does not arrive.
            </p>
            <p className="mt-1.5 text-label">{email}</p>
          </div>
        </div>

        {devResetUrl ? (
          <div
            data-testid="dev-reset-panel"
            className="mt-3 rounded-lg border border-accent-yellow/40 bg-accent-yellow-bg px-4 py-3"
          >
            <p className="fs-text font-semibold tracking-[0.08em] text-strong">
              Local development delivery
            </p>
            <p className="mt-1 fs-text leading-5 text-body">
              SMTP is not configured. This link appears only in local development.
            </p>
            <a
              href={devResetUrl}
              data-testid="dev-reset-link"
              className="mt-2 inline-flex fs-text font-semibold text-brand outline-none hover:underline focus-visible:underline"
            >
              Open password reset screen
            </a>
          </div>
        ) : null}

        <Button asChild variant="outline" className="mt-3 h-[42px] w-full rounded-[4px] fs-text">
          <Link href="/login">Back to sign in</Link>
        </Button>

        <button
          type="button"
          onClick={() => {
            setSent(false);
            setDevResetUrl(null);
            setEmail("");
          }}
          className="mt-2 w-full rounded-md py-1 text-center fs-text font-medium text-brand outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          Use a different email address
        </button>
      </AuthCard>
    );
  }

  if (token && resetComplete) {
    return (
      <AuthCard
        title="Password updated"
        description="Your new password is ready. Other sessions have been signed out."
      >
        <div className="flex items-start gap-3 rounded-lg border border-card-border bg-accent-teal-bg px-4 py-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
          <p className="fs-text leading-5 text-body">
            Sign in with your new password. If you did not make this change, contact your
            institution administrator immediately.
          </p>
        </div>
        <Button asChild className="mt-3 h-[42px] w-full rounded-[4px] fs-text font-medium">
          <Link href="/login">Continue to sign in</Link>
        </Button>
      </AuthCard>
    );
  }

  if (token) {
    return (
      <AuthCard
        title="Choose a new password"
        description="Use a password you have not used for this account before."
        footer={
          <p className="fs-text leading-5 text-label">
            This link is valid for 30 minutes and can only be used once.
          </p>
        }
      >
        <form onSubmit={handleReset} noValidate>
          <div className="space-y-3">
            <div>
              <label htmlFor="new-password" className={labelClass}>
                New password
              </label>
              <PasswordInput
                id="new-password"
                name="new-password"
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError(null);
                  if (confirmationError) setConfirmationError(null);
                }}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={
                  passwordError ? "new-password-error password-requirements" : "password-requirements"
                }
                disabled={resetting}
                placeholder="Enter a new password"
                className="h-[42px] fs-text md:fs-text"
              />
              {passwordError ? (
                <p id="new-password-error" className={fieldErrorClass}>
                  {passwordError}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="confirm-password" className={labelClass}>
                Confirm new password
              </label>
              <PasswordInput
                id="confirm-password"
                name="confirm-password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(event.target.value);
                  if (confirmationError) setConfirmationError(null);
                }}
                aria-invalid={Boolean(confirmationError)}
                aria-describedby={confirmationError ? "confirm-password-error" : undefined}
                disabled={resetting}
                placeholder="Repeat the new password"
                className="h-[42px] fs-text md:fs-text"
              />
              {confirmationError ? (
                <p id="confirm-password-error" className={fieldErrorClass}>
                  {confirmationError}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-card-border bg-subtle px-3.5 py-3">
            <p id="password-requirements" className="fs-text font-semibold text-body">
              Password requirements
            </p>
            <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
              {PASSWORD_REQUIREMENTS.map((requirement) => {
                const met = requirement.met(password);
                return (
                  <li
                    key={requirement.label}
                    className={
                      met
                        ? "flex items-center gap-1.5 fs-text leading-5 text-brand"
                        : "flex items-center gap-1.5 fs-text leading-5 text-label"
                    }
                  >
                    <span
                      className={
                        met
                          ? "grid size-3.5 shrink-0 place-items-center rounded-full bg-brand text-on-primary"
                          : "grid size-3.5 shrink-0 place-items-center rounded-full border border-chrome"
                      }
                    >
                      {met ? <Check className="size-2.5" aria-hidden="true" /> : null}
                    </span>
                    {requirement.label}
                  </li>
                );
              })}
            </ul>
          </div>

          {resetError ? (
            <div className="mt-4">
              <FormError message={resetError} />
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={resetting}
            aria-busy={resetting}
            className="mt-3 h-[42px] w-full gap-2 rounded-[4px] fs-text font-medium"
          >
            {resetting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                Updating password
              </>
            ) : (
              "Update password"
            )}
          </Button>

          <Link
            href="/forgot-password"
            className="mt-2 flex items-center justify-center gap-1.5 rounded-md py-1 fs-text font-medium text-brand outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Request a new link
          </Link>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Enter your registered email address"
      footer={
        <p className="fs-text leading-5 text-label">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-medium text-brand outline-none hover:underline focus-visible:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleRequest} noValidate>
        <div>
          <label htmlFor="reset-email" className={labelClass}>
            Email address
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="reset-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) setEmailError(null);
              }}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "reset-email-error" : undefined}
              disabled={requesting}
              className="h-[42px] rounded-[4px] border-[#9e9e9e] bg-white pl-10 pr-3 fs-text placeholder:text-muted-foreground md:fs-text"
              style={{ paddingLeft: 40 }}
              placeholder="Email"
            />
          </div>
          {emailError ? (
            <p id="reset-email-error" className={fieldErrorClass}>
              {emailError}
            </p>
          ) : null}
        </div>

        {requestError ? (
          <div className="mt-4">
            <FormError message={requestError} />
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={requesting}
          aria-busy={requesting}
          className="mt-3 h-[42px] w-full gap-2 rounded-[4px] fs-text font-medium"
        >
          {requesting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Sending link
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>
    </AuthCard>
  );
}

