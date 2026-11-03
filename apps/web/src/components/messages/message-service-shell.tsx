"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Mail, Plus, RefreshCw, Send, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";

const tabs = [
  { label: "Logs", href: "/messages-message-logs" },
  { label: "Messages", href: "/messages" },
  { label: "Segments", href: "/messages-segment-list" },
  { label: "Users", href: "/messages-users-list" },
] as const;

type MessageServiceTab = (typeof tabs)[number]["label"];

const actions = [
  { label: "Create Template", href: "/messages-template-list", icon: Plus },
  { label: "Create Segment", href: "/messages-segment-list-create", icon: Plus },
  { label: "Send Message", href: "/messages-send-message", icon: Send },
  { label: "Recharge", href: "/messages-recharge-credits", icon: Wallet },
] as const;

export function MessageServiceShell({
  activeTab,
  children,
}: {
  activeTab: MessageServiceTab;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <section aria-label="Message Service" className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-4">
        <div className="flex min-w-[210px] items-center gap-3">
          <Mail className="size-6 shrink-0 text-primary" aria-hidden="true" />
          <h1 className="fs-title font-semibold text-heading">Message Service</h1>
        </div>
        <dl className="flex min-w-[190px] flex-1 items-center justify-center gap-8 text-center fs-text">
          <div className="space-y-1"><dt className="font-medium text-label">SMS Credits</dt><dd className="text-body">Unavailable</dd></div>
          <div className="space-y-1"><dt className="font-medium text-label">Email Credits</dt><dd className="text-body">Unavailable</dd></div>
        </dl>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => window.location.reload()} className="h-[38px] gap-2 border-primary px-3 text-primary hover:bg-primary/5 hover:text-primary">
            <RefreshCw aria-hidden="true" />Refresh
          </Button>
          {actions.map(({ label, href, icon: Icon }) => (
            <Button key={label} asChild variant="outline" className="h-[38px] gap-2 border-primary px-3 text-primary hover:bg-primary/5 hover:text-primary">
              <Link href={href}><Icon aria-hidden="true" />{label}</Link>
            </Button>
          ))}
        </div>
      </section>

      <nav aria-label="Message service sections" className="flex min-h-[60px] flex-wrap items-stretch border-b border-card-border bg-card">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={activeTab === tab.label ? "page" : undefined}
            className={`inline-flex min-h-[54px] items-center border-b-2 px-5 fs-text font-medium transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === tab.label ? "border-primary bg-subtle text-primary" : "border-transparent text-body"}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
