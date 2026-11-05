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
        data-parity="page-card"
        className={cn(
          "mb-[13.44px] block rounded-[var(--card-radius)] border-[0.666667px] border-card-border bg-surface p-[20.16px]",
          className,
        )}
      >
        <div data-parity="page-card-body" className="block">
          <div
            data-parity="page-card-row"
            className="flex items-center justify-between gap-[13.44px]"
          >
            <div
              data-parity="page-hero"
              className="flex min-w-0 items-center gap-[12.096px]"
            >
              {icon}
              <h1
                data-parity="page-title"
                className="fs-title block font-bold tracking-[-0.36288px] text-heading"
              >
                {title}
              </h1>
            </div>
            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={cn("flex flex-col gap-1", className)}>
      {breadcrumb}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <h1 className="fs-title font-bold tracking-[-0.36288px] text-heading">{title}</h1>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {description ? <p className="fs-text text-muted-foreground">{description}</p> : null}
    </header>
  );
}
