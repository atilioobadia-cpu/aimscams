"use client";

import { Inbox, Search } from "lucide-react";
import { useState } from "react";

import { MessageServiceShell } from "@/components/messages/message-service-shell";
import { MessageAdditionalFilters, type MessageFilterOption } from "@/components/messages/message-additional-filters";
import { Input } from "@/components/ui/input";

const USER_FILTER_OPTIONS: MessageFilterOption[] = [
  { id: "email", label: "Email", placeholder: "Email" },
];

export function MessageUsersPage() {
  const [nameQuery, setNameQuery] = useState("");
  const [phoneQuery, setPhoneQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [additionalFilterValues, setAdditionalFilterValues] = useState<Record<string, string>>({});

  return (
    <MessageServiceShell activeTab="Users">
      <section aria-label="Message users" className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="flex min-h-[64px] flex-wrap items-center gap-2 border-b border-card-border p-3">
          <div className="relative w-[73px]">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} placeholder="Name" aria-label="Filter message users by name" className="h-[34px] !rounded-[6px] !border-primary pl-7" />
          </div>
          <div className="relative w-[75px]">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={phoneQuery} onChange={(event) => setPhoneQuery(event.target.value)} placeholder="Phone" aria-label="Filter message users by phone" className="h-[34px] !rounded-[6px] !border-primary pl-7" />
          </div>
          <MessageAdditionalFilters
            options={USER_FILTER_OPTIONS}
            selected={selectedFilters}
            values={additionalFilterValues}
            onSelectedChange={setSelectedFilters}
            onValueChange={(id, value) => setAdditionalFilterValues((current) => ({ ...current, [id]: value }))}
          />
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
