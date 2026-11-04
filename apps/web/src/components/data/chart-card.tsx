import type { ReactNode } from "react";

import { cn } from "cn";

type ChartCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  testId?: string;
  dataSource?: string;
};

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  testId,
  dataSource,
}: ChartCardProps) {
  return (
    <section
      data-testid={testId}
      data-source={dataSource}
      className={cn("rounded-[6px] border border-card-border bg-surface p-[20.16px] min-h-[495.58px]", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[14.67px] font-bold leading-tight text-strong">{title}</h2>
          {description ? <p className="mt-1 fs-text text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
