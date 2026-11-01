import type { ReactNode } from "react";

import { cn } from "cn";

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  variant?: "plain" | "card";
  className?: string;
};

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  icon,
  variant = "plain",
  className,
}: PageHeaderProps) {
  if (variant === "card") {
    return (
      <header
        data-variant="card"
        className={cn(
          "flex min-h-[84px] flex-col gap-4 rounded-[var(--card-radius)] border border-card-border bg-surface px-6 py-3 sm:flex-row sm:items-center sm:justify-between",
          className,
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {icon}
          <h1 className="fs-title font-bold leading-tight text-heading">{title}</h1>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
    );
  }

  return (
    <div
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="min-w-0">
        {breadcrumb ? <div className="mb-2 fs-text text-muted-foreground">{breadcrumb}</div> : null}
        <h1 className="fs-title font-bold leading-tight text-heading">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-3xl fs-text text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

