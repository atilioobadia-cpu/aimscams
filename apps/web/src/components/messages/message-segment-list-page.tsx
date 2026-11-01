"use client";

import Link from "next/link";
import { useState } from "react";
import { Inbox, Mail, Plus, RefreshCw, Send, SlidersHorizontal, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";

const tabs = [
  { label: "Logs", href: "/messages-message-logs" },
  { label: "Messages", href: "/messages" },
  { label: "Segments", href: "/messages-segment-list", current: true },
  { label: "Users", href: "/messages-users-list" },
];

function ServiceAction({ href, children, icon: Icon }: { href?: string; children: string; icon: typeof Plus }) {
  return (
    <Button
      asChild={Boolean(href)}
      type="button"
      variant="outline"
      className="h-[38px] gap-2 border-primary px-3 text-primary hover:bg-primary/5 hover:text-primary"
    >
      {href ? <Link href={href}><Icon aria-hidden="true" />{children}</Link> : <><Icon aria-hidden="true" />{children}</>}
    </Button>
  );
}

export function MessageSegmentListPage() {
  const [filterField, setFilterField] = useState("Name");
  const [dateFilter, setDateFilter] = useState("Date");

  return (
    <div className="space-y-6">
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
          <ServiceAction href="/messages-template-list" icon={Plus}>Create Template</ServiceAction>
          <ServiceAction href="/messages-segment-list-create" icon={Plus}>Create Segment</ServiceAction>
          <ServiceAction href="/messages-send-message" icon={Send}>Send Message</ServiceAction>
          <ServiceAction href="/messages-recharge-credits" icon={Wallet}>Recharge</ServiceAction>
        </div>
      </section>

      <nav aria-label="Message service sections" className="flex min-h-[60px] flex-wrap items-stretch border-b border-card-border bg-card">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={tab.current ? "page" : undefined}
            className={`inline-flex min-h-[54px] items-center border-b-2 px-5 fs-text font-medium transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tab.current ? "border-primary bg-subtle text-primary" : "border-transparent text-body"}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <section aria-label="Segment list" className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="flex min-h-[72px] flex-wrap items-center gap-2 border-b border-card-border p-3">
          <label className="sr-only" htmlFor="segment-filter-field">Filter field</label>
          <select
            id="segment-filter-field"
            value={filterField}
            onChange={(event) => setFilterField(event.target.value)}
            style={{ width: 92 }}
            className="h-[42px] min-w-[90px] rounded-[var(--control-radius)] border border-primary bg-background px-3 fs-text font-medium text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option>Name</option><option>Alias</option>
          </select>
          <label className="sr-only" htmlFor="segment-date-filter">Date filter</label>
          <select
            id="segment-date-filter"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            style={{ width: 88 }}
            className="h-[42px] min-w-[88px] rounded-[var(--control-radius)] border border-primary bg-background px-3 fs-text font-medium text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option>Date</option><option>Newest first</option><option>Oldest first</option>
          </select>
          <Button type="button" variant="ghost" size="icon" aria-label="Table columns" title="Table columns" className="ml-auto text-primary hover:bg-primary/5 hover:text-primary">
            <SlidersHorizontal aria-hidden="true" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] table-fixed text-left fs-text">
            <thead className="border-b border-card-border bg-subtle font-semibold text-label">
              <tr>
                <th scope="col" className="w-[20%] px-4 py-3">Name</th>
                <th scope="col" className="w-[20%] px-4 py-3">Alias</th>
                <th scope="col" className="w-[20%] px-4 py-3">Date</th>
                <th scope="col" className="w-[36%] px-4 py-3">Enable / Disable</th>
                <th scope="col" className="w-[4%] px-3 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="h-[212px] px-4 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-4">
                    <Inbox className="size-12 text-muted-foreground" aria-hidden="true" />
                    <span>No data available</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
