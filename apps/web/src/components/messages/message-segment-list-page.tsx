"use client";

import { useState } from "react";
import { Inbox, SlidersHorizontal } from "lucide-react";

import { MessageServiceShell } from "@/components/messages/message-service-shell";
import { Button } from "@/components/ui/button";

export function MessageSegmentListPage() {
  const [filterField, setFilterField] = useState("Name");
  const [dateFilter, setDateFilter] = useState("Date");

  return (
    <MessageServiceShell activeTab="Segments">
      <section aria-label="Segment list" className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="flex min-h-[64px] flex-wrap items-center gap-2 border-b border-card-border p-3">
          <label className="sr-only" htmlFor="segment-filter-field">Filter field</label>
          <select
            id="segment-filter-field"
            value={filterField}
            onChange={(event) => setFilterField(event.target.value)}
            style={{ width: 72 }}
            className="h-[34px] min-w-[90px] rounded-[var(--control-radius)] border border-primary bg-background px-3 fs-text font-medium text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option>Name</option><option>Alias</option>
          </select>
          <label className="sr-only" htmlFor="segment-date-filter">Date filter</label>
          <select
            id="segment-date-filter"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            style={{ width: 65 }}
            className="h-[34px] min-w-[88px] rounded-[var(--control-radius)] border border-primary bg-background px-3 fs-text font-medium text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/50"
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
    </MessageServiceShell>
  );
}
