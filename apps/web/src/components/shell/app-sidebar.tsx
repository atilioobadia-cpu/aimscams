"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
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
  Home,
  Megaphone,
  MessageSquare,
  Settings,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { navItems, type NavChild, type NavIcon, type NavItem } from "@/lib/nav";

const navIcons: Record<NavIcon, LucideIcon> = {
  dashboard: Home,
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
  pathname,
  collapsed,
  active,
  expanded,
  onToggleExpand,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  active: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const Icon = navIcons[item.icon];
  const label = item.disabled ? `${item.label} (coming soon)` : item.label;
  const activeChild = item.children?.find((child) => isActivePath(pathname, child.href));

  const content = (
    <>
      <Icon
        className={cn("size-5 shrink-0", active ? "text-on-primary" : "text-heading")}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      {!collapsed ? (
        <>
          <span className="min-w-0 whitespace-nowrap">{item.label}</span>
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {item.badge ? (
              <span className="shrink-0 rounded-[4px] bg-primary-tint px-1.5 py-0.5 text-fs font-semibold text-primary">
                {item.badge}
              </span>
            ) : null}
            {item.chevron && !item.children ? (
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
  const controlClass = cn(
    "flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[6px] px-[17px] text-left text-fs leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
    !collapsed && "mx-2",
    collapsed && "mx-3 justify-center px-0",
    active
      ? "bg-primary font-semibold text-primary-foreground hover:bg-primary"
      : "text-heading hover:bg-tab-inactive",
    item.disabled && "cursor-not-allowed text-muted-foreground/70 hover:bg-transparent",
  );

  if (item.disabled || !item.href) {
    control = (
      <div
        role="link"
        aria-disabled="true"
        aria-label={label}
        data-testid="nav-item"
        data-nav-label={item.label}
        tabIndex={-1}
        className={controlClass}
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
        className={controlClass}
      >
        {content}
      </Link>
    );
  }

  if (item.children && !collapsed && item.href) {
    const isGroupActive = active || activeChild !== undefined;
    const groupLinkClass = cn(
      "flex h-[34px] min-w-0 flex-1 items-center gap-2 rounded-[6px] pl-[17px] pr-1 text-left text-fs leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
      isGroupActive ? "font-semibold text-primary" : "text-heading hover:text-primary",
    );

    return (
      <li
        data-testid="nav-group"
        data-nav-label={item.label}
        data-expanded={expanded ? "true" : "false"}
        className={cn(
          "mx-1.5 shrink-0 overflow-hidden rounded-[var(--card-radius)]",
          isGroupActive ? "bg-primary-tint" : "",
        )}
      >
        <div className="flex h-[var(--sidebar-row-height)] items-center">
          <Link
            href={item.href}
            prefetch={false}
            data-testid="nav-item"
            data-nav-label={item.label}
            data-active={active ? "true" : undefined}
            aria-current={active ? "page" : undefined}
            className={groupLinkClass}
          >
            <Icon className="size-5 shrink-0 text-primary" strokeWidth={1.8} aria-hidden="true" />
            <span className="min-w-0 truncate">{item.label}</span>
          </Link>
          <button
            type="button"
            aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
            aria-expanded={expanded}
            onClick={onToggleExpand}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ChevronDown
              className={cn("size-4 transition-transform", expanded && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        </div>
        {expanded ? (
          <ul className="m-0 flex list-none flex-col gap-[2px] p-0">
            {item.children.map((child) => (
              <SidebarChild
                key={child.href}
                child={child}
                active={isActivePath(pathname, child.href)}
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  if (!collapsed) {
    return (
      <li className="flex h-9 shrink-0 items-center">
        {control}
      </li>
    );
  }

  return (
    <li className="flex h-9 shrink-0 items-center">
      <Tooltip>
        <TooltipTrigger asChild>{control}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          {label}
        </TooltipContent>
      </Tooltip>
    </li>
  );
}

function SidebarChild({ child, active }: { child: NavChild; active: boolean }) {
  const Icon = navIcons[child.icon];

  return (
    <li className="h-7 shrink-0">
      <Link
        href={child.href}
        prefetch={false}
        aria-current={active ? "page" : undefined}
        data-testid="nav-subitem"
        data-nav-label={child.label}
        data-active={active ? "true" : undefined}
        className={cn(
          "flex h-full w-full items-center gap-2 rounded-[6px] pl-[37px] pr-2 text-fs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
          active
            ? "bg-primary font-semibold text-primary-foreground"
            : "text-heading hover:bg-white/60",
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 truncate">{child.label}</span>
      </Link>
    </li>
  );
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const activeGroup = navItems.find((item) =>
    item.children?.some((child) => isActivePath(pathname, child.href)),
  );
  const [manuallyExpandedGroup, setManuallyExpandedGroup] = useState<string | null>(null);
  const expandedGroup = activeGroup?.label ?? manuallyExpandedGroup;

  return (
    <aside
      data-testid="app-sidebar"
      data-state={collapsed ? "collapsed" : "expanded"}
      aria-label="Sidebar"
      style={{ width: "var(--sidebar-width)" }}
      className="fixed bottom-0 left-0 top-[var(--header-height)] z-40 flex flex-col border-r border-chrome bg-surface transition-[width] duration-200"
    >
      <nav
        id="app-sidebar-nav"
        aria-label="Primary"
        className="sidebar-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-2"
      >
        <ul className="m-0 flex list-none flex-col gap-[var(--space-4)] p-0">
          {navItems.map((item) => {
            const active = item.href ? isActivePath(pathname, item.href) : false;
            const expanded = expandedGroup === item.label;

            return (
              <SidebarItem
                key={item.label}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
                active={active}
                expanded={expanded}
                onToggleExpand={() =>
                  setManuallyExpandedGroup((current) =>
                    current === item.label ? null : item.label,
                  )
                }
              />
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
        style={{ bottom: "calc(var(--sidebar-footer-height) + 6px)" }}
        className="absolute -right-[18px] z-10 grid size-9 place-items-center rounded-full border border-chrome bg-surface text-brand outline-none transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {collapsed ? (
          <ChevronRight className="size-5" aria-hidden="true" />
        ) : (
          <ChevronLeft className="size-5" aria-hidden="true" />
        )}
      </button>

      <div
        data-testid="sidebar-footer"
        className="sidebar-footer flex shrink-0 items-center justify-center border-t border-chrome text-center"
      >
        {collapsed ? (
          <p className="sidebar-footer-wordmark font-bold text-brand-logo" aria-label="AIMSCAMS">
            A
          </p>
        ) : (
          <>
            <p className="sidebar-footer-wordmark font-bold tracking-wide text-brand-logo text-fs">
              AIMSCAMS
            </p>
            <p
              className="sidebar-footer-copyright text-muted-foreground"
              aria-label="© 2026 AIMSCAMS. All rights reserved."
            >
              <span className="sidebar-footer-copyright-full">
                © 2026 AIMSCAMS.<br />All rights reserved.
              </span>
              <span className="sidebar-footer-copyright-short" aria-hidden="true">
                © 2026
              </span>
            </p>
          </>
        )}
      </div>
    </aside>
  );
}

