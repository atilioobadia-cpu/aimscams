"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { FormError } from "@/components/auth/form-error";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiRequest } from "@/lib/api";
import {
  clearPendingMfaChallenge,
  savePendingMfaChallenge,
} from "@/lib/auth-challenge";

type LoginResponse =
  | { mfaRequired: true; challengeToken: string; expiresAt: string }
  | { user: { email: string }; expiresAt: string };

type FieldErrors = {
  email?: string;
  password?: string;
};

const labelClass = "mb-1.5 block text-[13px] font-medium text-body";
const fieldErrorClass = "mt-1.5 text-[12px] leading-5 text-accent-red";

function validNextPath(candidate: string | undefined): string {
  if (!candidate?.startsWith("/") || candidate.startsWith("//")) return "/dashboard";
  if (candidate === "/login" || candidate.startsWith("/login/")) return "/dashboard";
  return candidate;
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors: FieldErrors = {};
    if (!email.trim()) nextErrors.email = "Enter your email address.";
    if (!password) nextErrors.password = "Enter your password.";
    setFieldErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    clearPendingMfaChallenge();

    try {
      const result = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });

      if ("mfaRequired" in result) {
        savePendingMfaChallenge({
          challengeToken: result.challengeToken,
          expiresAt: result.expiresAt,
          email: email.trim(),
        });
        router.replace("/login/mfa");
        return;
      }

      router.replace(validNextPath(nextPath));
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 423 || error.code === "ACCOUNT_LOCKED") {
          setFormError("This account is temporarily locked. Try again later.");
        } else if (error.status === 429 || error.code === "IP_THROTTLED") {
          setFormError("Too many sign-in attempts from this network. Try again later.");
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError("Cannot reach the server. Check your connection and try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      description="Use your institution account. Access follows your role and branch."
      footer={
        <p className="text-[12px] leading-5 text-label">
          Accounts are created by your institution administrator. Contact them if you
          cannot access your account.
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">
          <div>
            <label htmlFor="email" className={labelClass}>
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((current) => ({ ...current, email: undefined }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              disabled={submitting}
              className="h-11 px-3.5 text-[15px]"
              placeholder="name@institution.co.tz"
            />
            {fieldErrors.email ? (
              <p id="email-error" className={fieldErrorClass}>
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-4">
              <label htmlFor="password" className="text-[13px] font-medium text-body">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[12px] font-medium text-brand outline-none hover:underline focus-visible:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((current) => ({ ...current, password: undefined }));
                }
              }}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              disabled={submitting}
              placeholder="Enter your password"
            />
            {fieldErrors.password ? (
              <p id="password-error" className={fieldErrorClass}>
                {fieldErrors.password}
              </p>
            ) : null}
          </div>
        </div>

        {formError ? (
          <div className="mt-5">
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
              Signing in
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </form>
    </AuthCard>
  );
}
