"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import {
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
  Landmark,
  Library,
  Mail,
  MessageCircle,
  Package as PackageIcon,
  PiggyBank,
  Receipt,
  RefreshCw,
  Scale,
  ScrollText,
  Settings,
  Shield,
  Upload,
  UserCog,
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
  package: PackageIcon,
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

/** Wakandi renders its nav glyphs inside a 16 × 13.44 box; icons are 13.44 square. */
function NavGlyph({
  Icon,
  tone,
  dataParity,
}: {
  Icon: LucideIcon;
  tone: "default" | "tinted" | "inverse";
  dataParity: string;
}) {
  return (
    <span
      data-parity={dataParity}
      className={cn(
        "flex shrink-0 items-center justify-center",
        tone === "inverse" && "text-primary-foreground",
        tone === "tinted" && "text-primary",
        tone === "default" && "text-heading",
      )}
      style={{ width: "16px", height: "13.44px" }}
    >
      <Icon className="size-[13.44px]" strokeWidth={1.8} aria-hidden="true" />
    </span>
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
}: {  item: NavItem;
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
      <NavGlyph
        Icon={Icon}
        tone={active && !item.children ? "inverse" : "default"}
        dataParity="nav-glyph"
      />
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge ? (
            <span className="shrink-0 rounded-[4px] bg-primary-tint px-1.5 py-0.5 fs-text font-semibold text-primary">
              {item.badge}
            </span>
          ) : null}
        </>
      ) : null}
    </>
  );

  let control: ReactNode;
  const controlClass = cn(
    "flex h-[var(--sidebar-row-height)] min-w-0 items-center rounded-[var(--sidebar-item-radius)] text-left text-[var(--sidebar-label-size)] leading-[normal] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
    collapsed ? "mx-auto justify-center" : "w-full gap-[6.72px] px-[10.08px] py-[6.72px]",
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
    // Only the group that owns the current route is tinted; an expanded but
    // inactive group stays flat and insets its children (measured on Wakandi).
    const tinted = active;
    return (
      <li
        data-testid="nav-group"
        data-nav-label={item.label}
        data-expanded={expanded ? "true" : "false"}
        data-active={tinted ? "true" : undefined}
        className="block shrink-0"
        style={{
          margin: tinted ? "3.36px 0" : "0 0 10.08px",
          padding: tinted ? "6.72px 0" : undefined,
          background: tinted ? "var(--primary-tint)" : undefined,
          borderRadius: tinted ? "8px" : undefined,
        }}
      >
        <div className="relative mb-[3.36px]">
          <button
            type="button"
            data-testid="nav-item"
            data-nav-label={item.label}
            data-active={tinted ? "true" : undefined}
            aria-expanded={expanded}
            onClick={onToggleExpand}
            style={{
              fontSize: "13.44px",
              height: "29.44px",
              boxShadow: tinted ? "rgba(0,0,0,0.05) 0px 1px 2px 0px" : "none",
            }}
            className={cn(
              "flex w-full min-w-0 items-center gap-[6.72px] rounded-[var(--sidebar-item-radius)] px-[10.08px] py-[6.72px] text-left leading-[normal] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
              tinted
                ? "bg-primary-tint font-semibold text-primary shadow-[rgba(0,0,0,0.05)_0_1px_2px_0]"
                : "text-heading hover:bg-tab-inactive",
            )}
          >
            <NavGlyph Icon={Icon} tone={tinted ? "tinted" : "default"} dataParity="nav-glyph" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </button>
          <span
            data-parity="nav-chevron"
            className="pointer-events-none absolute right-[10.08px] top-1/2 flex -translate-y-1/2 items-center justify-center"
            style={{ width: "16px", height: "10.75px", color: "#6c757d" }}
            aria-hidden="true"
          >
            {expanded ? (
              <ChevronRight className="size-[10.752px]" strokeWidth={3} />
            ) : (
              <ChevronDown className="size-[10.752px]" strokeWidth={3} />
            )}
          </span>
        </div>
        {expanded ? (
          <ul
            data-parity="nav-submenu"
            className="m-0 block list-none p-0"
            style={{ marginLeft: tinted ? undefined : "10.08px", marginRight: tinted ? undefined : "10.08px" }}
          >
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
      <li
        className="block shrink-0"
        style={{ height: "var(--sidebar-link-row-height)", marginBottom: "var(--sidebar-item-gap-link)" }}
      >
        {control}
      </li>
    );
  }

  return (
    <li
      className="block shrink-0"
      style={{ height: "var(--sidebar-link-row-height)", marginBottom: "var(--sidebar-item-gap-link)" }}
    >
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
    <li className="block shrink-0" style={{ margin: "1px 0" }}>
      <Link
        href={child.href}
        aria-current={active ? "page" : undefined}
        data-testid="nav-subitem"
        data-nav-label={child.label}
        data-active={active ? "true" : undefined}
        className={cn(
          "flex w-full items-center gap-[6.72px] rounded-[var(--sidebar-item-radius)] px-[10.08px] py-[6.72px] leading-[normal] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
          active
            ? "border-[0.666667px] border-primary bg-primary font-semibold text-primary-foreground shadow-[rgba(0,0,0,0.1)_0_1px_3px_0]"
            : "text-heading hover:bg-white/60",
        )}
        style={{ height: active ? "30.1px" : "var(--sidebar-subitem-height)", fontSize: "12.768px", boxShadow: active ? "rgba(0,0,0,0.1) 0px 1px 3px 0px" : "none" }}
      >
        <NavGlyph Icon={Icon} tone={active ? "inverse" : "default"} dataParity="nav-subitem-glyph" />
        <span className="min-w-0 flex-1 truncate">{child.label}</span>
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
  const [collapsedActiveGroup, setCollapsedActiveGroup] = useState<{ label: string; pathname: string } | null>(null);
  const isExpanded = (label: string) =>
    expandedGroups.has(label) ||
    (activeGroup?.label === label &&
      !(collapsedActiveGroup?.label === label && collapsedActiveGroup.pathname === pathname));

  return (
    <aside
      data-testid="app-sidebar"
      data-parity="sidebar"
      data-state={collapsed ? "collapsed" : "expanded"}
      aria-label="Sidebar"
      style={{ width: "var(--sidebar-width)" }}
      className="fixed bottom-0 left-0 top-[var(--header-height)] z-40 flex flex-col overflow-hidden bg-surface transition-[width] duration-300"
    >
      <nav
        id="app-sidebar-nav"
        data-parity="sidebar-nav"
        aria-label="Primary"
        className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <ul data-parity="sidebar-menu" className="m-0 block list-none p-[6.72px]">
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
                onToggleExpand={() => {
                  if (activeGroup?.label === item.label) {
                    const shouldCollapse = isExpanded(item.label);
                    setExpandedGroups((current) => {
                      const next = new Set(current);
                      next.delete(item.label);
                      return next;
                    });
                    setCollapsedActiveGroup(
                      shouldCollapse ? { label: item.label, pathname } : null,
                    );
                    return;
                  }
                  setExpandedGroups((current) => {
                    const next = new Set(current);
                    if (next.has(item.label)) next.delete(item.label);
                    else next.add(item.label);
                    return next;
                  });
                }}
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
            data-parity="sidebar-toggle"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar-nav"
            onClick={onToggle}
            style={{
              bottom: "calc(var(--sidebar-footer-height) - 6.88px)",
              left: "calc(var(--sidebar-width) - var(--sidebar-toggle-size) - 0.67px)",
              fontSize: "11.76px",
              fontWeight: 500,
              padding: "6.72px 8.4px",
              boxShadow: "rgba(0,0,0,0.1) 0px 2px 4px 0px",
            }}
            className="absolute z-10 box-border inline-flex h-[var(--sidebar-toggle-size)] w-[var(--sidebar-toggle-size)] items-center justify-center gap-0 overflow-hidden rounded-full border-[0.666667px] border-[#dee2e6] bg-transparent text-primary shadow-[rgba(0,0,0,0.1)_0_2px_4px_0] outline-none transition-colors duration-[120ms] hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <span
              data-parity="sidebar-toggle-glyph"
              className="block shrink-0"
              style={{ width: "11.76px", height: "12px", color: "#057573" }}
            >
              {collapsed ? (
                <ChevronRight className="size-[11.76px]" strokeWidth={2} aria-hidden="true" />
              ) : (
                <ChevronLeft className="size-[11.76px]" strokeWidth={2} aria-hidden="true" />
              )}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {collapsed ? "Expand sidebar" : "Collapse sidebar"}
        </TooltipContent>
      </Tooltip>

      <div
        data-testid="sidebar-footer"
        data-parity="sidebar-footer"
        className="sidebar-footer flex shrink-0 items-center text-center"
      >
        {collapsed ? (
          <p
            data-parity="sidebar-wordmark"
            className="sidebar-footer-wordmark font-bold text-brand-logo"
            aria-label="AIMSCAMS"
          >
            A
          </p>
        ) : (
          <>
            <p
              data-parity="sidebar-wordmark"
              className="sidebar-footer-wordmark font-bold text-brand-logo"
            >
              AIMSCAMS
            </p>
            <p
              data-parity="sidebar-copyright"
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
