"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, LoaderCircle, User } from "lucide-react";
import { useState, type FormEvent } from "react";

import { FormError } from "@/components/auth/form-error";
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

const fieldClass =
  "h-[69px] w-full rounded-[4px] border border-[#9e9e9e] bg-white pl-[63px] pr-[20px] text-[21px] text-[#212121] placeholder:text-[#9e9e9e] focus:border-[#057573] focus:outline-none focus:ring-0 md:text-[21px]";
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
  const [showPassword, setShowPassword] = useState(false);
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
    <form onSubmit={handleSubmit} noValidate className="space-y-0">
      <div className="relative">
        <User className="pointer-events-none absolute left-[24px] top-1/2 size-[22px] -translate-y-1/2 text-[#666666]" />
        <Input
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
          className={fieldClass}
          placeholder="Email"
        />
      </div>
      {fieldErrors.email ? (
        <p id="email-error" className={fieldErrorClass}>
          {fieldErrors.email}
        </p>
      ) : null}

      <div className="relative mt-[72px]">
        <KeyRound className="pointer-events-none absolute left-[24px] top-1/2 size-[22px] -translate-y-1/2 text-[#666666]" />
        <Input
          name="password"
          type={showPassword ? "text" : "password"}
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
          className={`${fieldClass} pl-[63px] pr-[52px]`}
          placeholder="Password"
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="absolute inset-y-0 right-0 grid w-[52px] place-items-center text-[#212121] outline-none"
        >
          {showPassword ? <EyeOff className="size-[22px]" /> : <Eye className="size-[22px]" />}
        </button>
      </div>
      {fieldErrors.password ? (
        <p id="password-error" className={fieldErrorClass}>
          {fieldErrors.password}
        </p>
      ) : null}

      <div className="mt-[44px] flex justify-end">
        <Link
          href="/forgot-password"
          className="text-[20px] font-normal text-[#057573] outline-none hover:underline focus-visible:underline"
        >
          Forgot password
        </Link>
      </div>

      {formError ? (
        <div className="mt-[8px] w-full">
          <FormError message={formError} />
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className="mt-[42px] flex h-[75px] w-full items-center justify-center rounded-[4px] bg-[#057573] text-[24px] font-medium text-white transition-colors hover:bg-[#046664] disabled:opacity-60"
      >
        {submitting ? (
          <>
            <LoaderCircle className="mr-2 size-5 animate-spin" aria-hidden="true" />
            Signing in
          </>
        ) : (
          "Login"
        )}
      </button>
    </form>
  );
}
