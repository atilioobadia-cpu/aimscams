"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";

import { AppHeader } from "@/components/shell/app-header";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { ToastProvider } from "@/components/ui/toast";
import type { DashboardFixture } from "@/lib/fixtures/dashboard";
import { applyAppearancePreferences, readAppearancePreferences } from "@/lib/appearance";

const SIDEBAR_WIDTH = {
  expanded: 200,
  collapsed: 76,
} as const;

type AppShellProps = {
  children: ReactNode;
  institution: DashboardFixture["institution"];
  branch: DashboardFixture["branch"];
  user: DashboardFixture["user"];
};

export function AppShell({ children, institution, branch, user }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const narrowViewport = window.matchMedia("(max-width: 800px)");
    const syncCollapsedState = () => setCollapsed(narrowViewport.matches);

    syncCollapsedState();
    narrowViewport.addEventListener("change", syncCollapsedState);
    return () => narrowViewport.removeEventListener("change", syncCollapsedState);
  }, []);

  useEffect(() => {
    applyAppearancePreferences(readAppearancePreferences());
  }, []);

  const width = collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded;

  function toggleSidebar() {
    setCollapsed((current) => !current);
  }

  return (
    <ToastProvider>
      <div
        data-sidebar-state={collapsed ? "collapsed" : "expanded"}
        style={{ "--sidebar-width": `${width}px` } as CSSProperties}
      >
        <a
          href="#main-content"
          className="sr-only z-[60] rounded-lg bg-brand px-4 py-3 text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>

        <AppHeader institution={institution} branch={branch} user={user} />
        <AppSidebar collapsed={collapsed} onToggle={toggleSidebar} isAdmin={user.role.toLowerCase().includes("admin")} />

        <main
          id="main-content"
          data-parity="main"
          style={{ left: width }}
          className="fixed bottom-0 right-0 top-[var(--header-height)] flex flex-col overflow-auto bg-[var(--page-bg)] transition-[left] duration-300"
        >
          <div
            data-parity="content"
            className="content-fade min-h-full w-full bg-[var(--page-bg)] px-[var(--content-padding-x)] py-[var(--content-padding-y)]"
          >
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
