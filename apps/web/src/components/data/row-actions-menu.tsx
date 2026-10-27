"use client";

import Link from "next/link";
import { Fragment } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "cn";

export type RowAction = {
  label: string;
  icon?: LucideIcon;
  href?: string;
  onSelect?: () => void;
  variant?: "default" | "destructive";
  separatorBefore?: boolean;
};

/**
 * One table-row action menu. Actions stay behind the three-dot trigger so the
 * right-hand column remains calm and every table uses the same interaction.
 */
export function RowActionsMenu({
  label,
  actions,
  className,
}: {
  label: string;
  actions: RowAction[];
  className?: string;
}) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Open actions for ${label}`}
          className={cn("size-8 text-muted-foreground hover:text-strong", className)}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 min-w-44">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const content = (
            <>
              {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
              {action.label}
            </>
          );

          return (
            <Fragment key={action.label}>
              {action.separatorBefore && index > 0 ? <DropdownMenuSeparator /> : null}
              {action.href ? (
                <DropdownMenuItem
                  asChild
                  variant={action.variant}
                  className="gap-2 px-2 py-1.5"
                >
                  <Link href={action.href}>{content}</Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  variant={action.variant}
                  className="gap-2 px-2 py-1.5"
                  onSelect={action.onSelect}
                >
                  {content}
                </DropdownMenuItem>
              )}
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
