import type { ReactNode } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
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
    <AuthShell title={title}>
      <section
        className={cn(
          "w-full rounded-[8px] border border-card-border bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.15)]",
          className,
        )}
      >
        {description ? <p className="text-fs leading-5 text-label">{description}</p> : null}
        <div className={description ? "mt-3" : undefined}>{children}</div>
        {footer ? (
          <div className="mt-4 border-t border-card-border pt-3">{footer}</div>
        ) : null}
      </section>
    </AuthShell>
  );
}

