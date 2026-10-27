import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "cn";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <section
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--card-radius)] border border-dashed border-card-border bg-surface px-[var(--space-24)] py-[var(--space-24)] text-center",
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-full bg-accent-teal-bg text-brand">
        <Icon className="size-6" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <h2 className="mt-[var(--space-14)] fs-text font-bold text-strong">{title}</h2>
      <p className="mt-1 max-w-[420px] fs-text leading-[1.4] text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-[var(--space-18)]">{action}</div> : null}
    </section>
  );
}
