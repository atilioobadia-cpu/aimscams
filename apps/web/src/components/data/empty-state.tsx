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
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-card-border bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      <span className="grid size-16 place-items-center rounded-full bg-accent-teal-bg text-brand">
        <Icon className="size-7" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-[var(--fs)] font-bold text-strong">{title}</h2>
      <p className="mt-2 max-w-lg text-[var(--fs)] leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}

