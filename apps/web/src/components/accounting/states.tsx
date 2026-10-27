"use client";

import { Lock, RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "cn";

export function PanelSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2 p-[var(--space-14)]", className)} aria-busy="true">
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-8 animate-pulse rounded-[6px] bg-muted"
          style={{ opacity: 1 - index * 0.08 }}
        />
      ))}
    </div>
  );
}

export function ErrorPanel({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-[var(--card-radius)] border border-accent-red/30 bg-accent-red-bg px-[var(--space-14)] py-[var(--space-12)] text-fs text-strong",
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <TriangleAlert className="size-4 shrink-0 text-accent-red" aria-hidden="true" />
        <span>{message}</span>
      </span>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RotateCcw className="size-4" aria-hidden="true" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function ForbiddenPanel({
  message = "Your role cannot open this page. Ask an administrator for the accounting permission.",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--card-radius)] border border-dashed border-card-border bg-surface px-[var(--space-24)] py-[var(--space-24)] text-center",
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-full bg-accent-yellow-bg text-accent-yellow">
        <Lock className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-[var(--space-14)] text-fs font-bold text-strong">Access restricted</h2>
      <p className="mt-1 max-w-[420px] text-fs leading-[1.4] text-muted-foreground">{message}</p>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-fs text-accent-red">
      {message}
    </p>
  );
}

export function SuccessNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className="text-fs text-accent-teal">
      {message}
    </p>
  );
}
