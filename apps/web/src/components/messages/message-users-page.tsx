"use client";

import { Inbox, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { MessageServiceShell } from "@/components/messages/message-service-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MessageUsersPage() {
  const [query, setQuery] = useState("");

  return (
    <MessageServiceShell activeTab="Users">
      <section aria-label="Message users" className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="flex min-h-[72px] flex-wrap items-center gap-2 border-b border-card-border p-3">
          <div className="relative w-full max-w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or phone" aria-label="Search message users by name or phone" className="h-[42px] pl-9" />
          </div>
          <Button type="button" variant="outline" className="h-[42px] gap-2 border-primary px-3 text-primary hover:bg-primary/5 hover:text-primary">
            <SlidersHorizontal aria-hidden="true" />Add Filters
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left fs-text">
            <thead className="border-b border-card-border bg-subtle font-semibold text-label">
              <tr>
                <th scope="col" className="whitespace-nowrap px-4 py-3">Name</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3">Phone</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3">Email ID</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3">Enable / Disable SMS</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3">Enable / Disable Email</th>
                <th scope="col" className="px-3 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="h-[212px] px-4 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-4">
                    <Inbox className="size-12 text-muted-foreground" aria-hidden="true" />
                    <span>{query.trim() ? "No data available" : "No data available"}</span>
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
