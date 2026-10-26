"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";

import { AppHeader } from "@/components/shell/app-header";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { ChatFab } from "@/components/shell/chat-fab";
import type { DashboardFixture } from "@/lib/fixtures/dashboard";

const SIDEBAR_WIDTH = {
  expanded: 300,
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

  const width = collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded;

  function toggleSidebar() {
    setCollapsed((current) => !current);
  }

  return (
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
      <AppSidebar collapsed={collapsed} onToggle={toggleSidebar} />

      <main
        id="main-content"
        style={{ paddingLeft: width }}
        className="min-h-screen pt-[97px] transition-[padding-left] duration-200"
      >
        <div className="px-[22px] pb-12 pt-5">{children}</div>
      </main>

      <ChatFab />
    </div>
  );
}
