import type { ReactNode } from "react";

import { cn } from "cn";

export function FilterBar({
  children,
  className,
  label = "Filters",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="search"
      aria-label={label}
      className={cn(
        "flex flex-wrap items-end gap-3 rounded-xl border border-card-border bg-surface p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
