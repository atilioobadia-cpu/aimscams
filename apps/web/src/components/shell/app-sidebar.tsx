"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  Banknote,
  BookOpen,
  Box,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Grid2X2,
  Home,
  Inbox,
  Mail,
  MessageCircle,
  Landmark,
  Library,
  MessagesSquare,
  Package,
  PiggyBank,
  Receipt,
  RefreshCw,
  Scale,
  ScrollText,
  Settings,
  Shield,
  Upload,
  UserCog,
  Users,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { cn } from "cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { navItems, type NavChild, type NavIcon, type NavItem } from "@/lib/nav";

const navIcons: Record<NavIcon, LucideIcon> = {
  dashboard: Home,
  clients: UsersRound,
  accounts: Briefcase,
  transactions: Banknote,
  accounting: FileText,
  requests: Mail,
  messages: MessageCircle,
  campaigns: Grid2X2,
  reports: BarChart3,
  import: Upload,
  "business-account": Briefcase,
  settings: Settings,
  book: BookOpen,
  building: Building2,
  package: Package,
  shield: Shield,
  users: UserCog,
  scroll: ScrollText,
  wrench: Wrench,
  file: FileText,
  landmark: Landmark,
  piggy: PiggyBank,
  receipt: Receipt,
  card: CreditCard,
  clock: Clock,
  check: CheckCircle2,
  refresh: RefreshCw,
  box: Box,
  library: Library,
  scale: Scale,
  chart: BarChart3,
};

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  isAdmin?: boolean;
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isItemActive(pathname: string, item: NavItem): boolean {
  if (!item.href) return false;
  if (item.href === "/accounting") {
    return pathname === "/accounting" || pathname.startsWith("/accounting-");
  }
  // Account screens keep the flat blueprint routes (`/account-loan-application`, …),
  // so they do not share the `/accounts` prefix with the section landing page.
  if (item.href === "/accounts") {
    return pathname === "/accounts" || pathname.startsWith("/account-");
  }
  if (item.href === "/reports") {
    return pathname === "/reports" || pathname.startsWith("/reports-");
  }
  if (item.href === "/import") {
    return pathname === "/import" || pathname.startsWith("/import-");
  }
  if (item.href === "/messages") {
    return pathname === "/messages" || pathname.startsWith("/messages-");
  }
  if (item.href === "/transactions") {
    return pathname === "/transactions" || pathname.startsWith("/transaction-");
  }
  return (
    isActivePath(pathname, item.href) ||
    Boolean(item.children?.some((child) => isActivePath(pathname, child.href)))
  );
}

function SidebarItem({
  item,
  pathname,
  collapsed,
  active,
  expanded,
  onToggleExpand,
  isAdmin,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  active: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  isAdmin?: boolean;
}) {
  const Icon = navIcons[item.icon];
  const label = item.disabled ? `${item.label} (coming soon)` : item.label;

  const content = (
    <>
      <Icon
        className={cn("size-[var(--sidebar-icon-size)] shrink-0", active ? "text-on-primary" : "text-heading", item.icon === "messages" && "message-circle-search")}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      {!collapsed ? (
        <>
          <span className="min-w-0 whitespace-nowrap">{item.label}</span>
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {item.badge ? (
              <span className="shrink-0 rounded-[4px] bg-primary-tint px-1.5 py-0.5 fs-text font-semibold text-primary">
                {item.badge}
              </span>
            ) : null}
            {item.chevron && !item.children ? (
              <ChevronDown
                className={cn("size-3", active ? "text-on-primary" : "text-heading")}
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
    "flex h-[var(--sidebar-row-height)] min-w-0 flex-1 items-center gap-[7px] rounded-[var(--sidebar-item-radius)] text-left text-[var(--sidebar-label-size)] leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
    !collapsed && "ml-[6.67px] mr-3 pl-3",
    collapsed && "mx-3 justify-start pl-4",
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
        style={{ fontSize: "var(--sidebar-label-size)" }}
      >
        {content}
      </div>
    );
  } else {
    control = (
      <Link
        href={item.href}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        data-testid="nav-item"
        data-nav-label={item.label}
        data-active={active ? "true" : undefined}
        className={controlClass}
        style={{ fontSize: "var(--sidebar-label-size)" }}
      >
        {content}
      </Link>
    );
  }

  if (item.children && !collapsed && item.href) {
    const isGroupActive = isActivePath(pathname, item.href);
    const groupLinkClass = cn(
      "flex h-full min-w-0 flex-1 items-center gap-[7px] rounded-[var(--sidebar-item-radius)] pl-3 text-left text-[var(--sidebar-label-size)] leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
      isGroupActive
        ? "bg-primary font-semibold text-primary-foreground hover:bg-primary"
        : "text-heading hover:bg-tab-inactive",
    );

    return (
      <li
        data-testid="nav-group"
        data-nav-label={item.label}
        data-expanded={expanded ? "true" : "false"}
        style={{ marginLeft: "6.67px", marginRight: "12px", marginBottom: "var(--sidebar-item-gap-group)" }}
        className="shrink-0 overflow-visible"
      >
        <div className="flex h-[var(--sidebar-row-height)] items-center">
          <button
            type="button"
            data-testid="nav-item"
            data-nav-label={item.label}
            data-active={isGroupActive ? "true" : undefined}
            aria-expanded={expanded}
            onClick={onToggleExpand}
            className={groupLinkClass}
            style={{ fontSize: "var(--sidebar-label-size)" }}
          >
            <Icon className={cn("size-[var(--sidebar-icon-size)] shrink-0 text-heading", item.icon === "messages" && "message-circle-search")} strokeWidth={1.8} aria-hidden="true" />
            <span className="min-w-0 truncate">{item.label}</span>
          </button>
          <button
            type="button"
            aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
            aria-expanded={expanded}
            onClick={onToggleExpand}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-[var(--sidebar-item-radius)] text-heading outline-none transition-colors hover:bg-tab-inactive focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ChevronDown
              className={cn("size-3 transition-transform", expanded && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        </div>
        {expanded ? (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {item.children
              .filter((child) => !(child.href === "/system-logs" && !isAdmin))
              .map((child) => (
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
      <li className="flex h-[var(--sidebar-row-height)] shrink-0 items-center" style={{ marginBottom: item.label === "Campaigns" ? "39.33px" : "var(--sidebar-item-gap-link)" }}>
        {control}
      </li>
    );
  }

  return (
    <li className="flex h-[var(--sidebar-row-height)] shrink-0 items-center" style={{ marginBottom: item.label === "Campaigns" ? "39.33px" : "var(--sidebar-item-gap-link)" }}>
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
    <li className="h-[var(--sidebar-subitem-height)] shrink-0">
      <Link
        href={child.href}
        aria-current={active ? "page" : undefined}
        data-testid="nav-subitem"
        data-nav-label={child.label}
        data-active={active ? "true" : undefined}
        className={cn(
          "flex h-full w-full items-center gap-[7px] rounded-[var(--sidebar-item-radius)] pl-[33px] pr-2 text-[var(--sidebar-label-size)] leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
          active
            ? "bg-primary font-semibold text-primary-foreground"
            : "text-heading hover:bg-white/60",
        )}
      >
        <Icon className="size-[var(--sidebar-icon-size)] shrink-0" aria-hidden="true" />
        <span className="min-w-0 truncate">{child.label}</span>
      </Link>
    </li>
  );
}

export function AppSidebar({ collapsed, onToggle, isAdmin }: AppSidebarProps) {
  const pathname = usePathname();
  const activeGroup = navItems.find((item) =>
    item.children && isItemActive(pathname, item),
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());
  // Auto-expand the active group on navigation.
  useEffect(() => {
    if (activeGroup?.label) {
      setExpandedGroups((current) => {
        if (current.has(activeGroup.label)) return current;
        const next = new Set(current);
        next.add(activeGroup.label);
        return next;
      });
    }
  }, [activeGroup?.label, pathname]);
  const isExpanded = (label: string) => expandedGroups.has(label);

  return (
    <aside
      data-testid="app-sidebar"
      data-state={collapsed ? "collapsed" : "expanded"}
      aria-label="Sidebar"
      style={{ width: "var(--sidebar-width)" }}
      className="fixed bottom-0 left-0 top-[var(--header-height)] z-40 flex flex-col border-r border-chrome bg-surface transition-[width] duration-300"
    >
      <nav
        id="app-sidebar-nav"
        aria-label="Primary"
        className="sidebar-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-[6.67px]"
      >
        <ul className="m-0 flex list-none flex-col p-0">
          {navItems.map((item) => {
            const active = isItemActive(pathname, item);
            const expanded = isExpanded(item.label);

            return (
              <SidebarItem
                key={item.label}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
                active={active}
                expanded={expanded}
                isAdmin={isAdmin}
                onToggleExpand={() =>
                  setExpandedGroups((current) => {
                    const next = new Set(current);
                    if (next.has(item.label)) next.delete(item.label);
                    else next.add(item.label);
                    return next;
                  })
                }
              />
            );
          })}
        </ul>
      </nav>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-testid="sidebar-toggle"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar-nav"
            onClick={onToggle}
            style={{ bottom: "calc(var(--sidebar-footer-height) - 6.5px)", left: collapsed ? "calc(var(--sidebar-collapsed-width) - var(--sidebar-toggle-size))" : "calc(var(--sidebar-width) - var(--sidebar-toggle-size))" }}
            className="absolute z-10 box-border grid h-[var(--sidebar-toggle-size)] w-[var(--sidebar-toggle-size)] place-items-center rounded-full border border-chrome bg-white text-primary shadow-[0_1px_3px_rgba(0,0,0,0.12)] outline-none transition-colors duration-[120ms] hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="h-[10px] w-[10px]" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-[10px] w-[10px]" strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {collapsed ? "Expand sidebar" : "Collapse sidebar"}
        </TooltipContent>
      </Tooltip>

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
            <p className="sidebar-footer-wordmark font-bold tracking-wide text-brand-logo fs-text">
              AIMSCAMS
            </p>
            <p
              className="sidebar-footer-copyright text-muted-foreground"
              aria-label="© 2026 AIMSCAMS. All rights reserved."
            >
              <span className="sidebar-footer-copyright-full">
                © 2026 AIMSCAMS. All rights<br />reserved.
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
