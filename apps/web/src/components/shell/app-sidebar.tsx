"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Landmark,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { navItems, type NavIcon, type NavItem } from "@/lib/nav";

const navIcons: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  clients: Users,
  accounts: Landmark,
  transactions: ArrowLeftRight,
  accounting: BookOpen,
  requests: ClipboardList,
  messages: MessageSquare,
  campaigns: Megaphone,
  reports: BarChart3,
  import: Upload,
  "business-account": Briefcase,
  settings: Settings,
};

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarItem({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  const Icon = navIcons[item.icon];
  const label = item.disabled ? `${item.label} (coming soon)` : item.label;

  const classes = cn(
    "flex h-11 flex-1 items-center gap-3 rounded-[8px] pl-4 pr-4 text-left text-[18px] leading-none outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
    collapsed ? "mx-3 justify-center px-0" : "ml-3 mr-[23px]",
    active ? "bg-brand font-semibold text-on-primary hover:bg-brand" : "text-body hover:bg-subtle",
    item.disabled && "cursor-not-allowed text-muted-foreground/70 hover:bg-transparent",
  );

  const content = (
    <>
      <Icon
        className={cn("size-5 shrink-0", active ? "text-on-primary" : "text-body")}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      {!collapsed ? (
        <>
          <span className="min-w-0 truncate">{item.label}</span>
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {item.badge ? (
              <span className="rounded-full bg-subtle px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {item.badge}
              </span>
            ) : null}
            {item.chevron ? (
              <ChevronDown
                className={cn("size-4", active ? "text-on-primary" : "text-muted-foreground")}
                aria-hidden="true"
              />
            ) : null}
          </span>
        </>
      ) : null}
    </>
  );

  let control: ReactNode;

  if (item.disabled || !item.href) {
    control = (
      <div
        role="link"
        aria-disabled="true"
        aria-label={label}
        data-testid="nav-item"
        data-nav-label={item.label}
        tabIndex={-1}
        className={classes}
      >
        {content}
      </div>
    );
  } else {
    control = (
      <Link
        href={item.href}
        prefetch={false}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        data-testid="nav-item"
        data-nav-label={item.label}
        data-active={active ? "true" : undefined}
        className={classes}
      >
        {content}
      </Link>
    );
  }

  if (!collapsed) return control;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{control}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      data-testid="app-sidebar"
      data-state={collapsed ? "collapsed" : "expanded"}
      aria-label="Sidebar"
      style={{ width: "var(--sidebar-width)" }}
      className="fixed bottom-0 left-0 top-[97px] z-40 flex flex-col border-r border-chrome bg-surface transition-[width] duration-200"
    >
      <nav
        id="app-sidebar-nav"
        aria-label="Primary"
        className="sidebar-scroll min-h-0 flex-1 overflow-y-auto pt-[66px]"
      >
        <ul className="pb-4">
          {navItems.map((item) => {
            const active = item.href ? isActivePath(pathname, item.href) : false;
            return (
              <li key={item.label} className="flex h-[60px] items-center">
                <SidebarItem item={item} collapsed={collapsed} active={active} />
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        type="button"
        data-testid="sidebar-toggle"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        aria-controls="app-sidebar-nav"
        onClick={onToggle}
        style={{ top: "clamp(320px, 716px, calc(100vh - 330px))" }}
        className="absolute -right-[22px] z-10 grid size-11 place-items-center rounded-full border border-chrome bg-surface text-brand shadow-sm outline-none transition-colors hover:bg-subtle focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {collapsed ? (
          <ChevronRight className="size-5" aria-hidden="true" />
        ) : (
          <ChevronLeft className="size-5" aria-hidden="true" />
        )}
      </button>

      <div
        data-testid="sidebar-footer"
        className="shrink-0 border-t border-chrome px-4 py-5 text-center"
      >
        {collapsed ? (
          <p className="text-lg font-bold text-brand-logo" aria-label="AIMSCAMS">
            A
          </p>
        ) : (
          <>
            <p className="text-[18px] font-bold tracking-wide text-brand-logo">AIMSCAMS</p>
            <p className="mt-2 text-[14px] leading-5 text-muted-foreground">
              © 2026 AIMSCAMS.
              <br />
              All rights reserved.
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
