import type { ReactNode } from "react";

import { cn } from "cn";

type ChartCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  testId?: string;
};

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  testId,
}: ChartCardProps) {
  return (
    <section
      data-testid={testId}
      className={cn("rounded-xl border border-card-border bg-surface p-[30px]", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="fs-text font-bold leading-tight text-strong">{title}</h2>
          {description ? <p className="mt-1 fs-text text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

