import type { ReactNode } from "react";

import { cn } from "cn";

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function AuthCard({ title, description, children, footer, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-card-border bg-surface px-6 py-7 sm:px-9 sm:py-9",
        className,
      )}
    >
      <div>
        <h1 className="text-[29px] font-bold leading-tight tracking-[-0.025em] text-strong">
          {title}
        </h1>
        {description ? (
          <p className="mt-2.5 text-[14px] leading-6 text-label">{description}</p>
        ) : null}
      </div>
      <div className="mt-7">{children}</div>
      {footer ? (
        <div className="mt-7 border-t border-card-border pt-5">{footer}</div>
      ) : null}
    </div>
  );
}
