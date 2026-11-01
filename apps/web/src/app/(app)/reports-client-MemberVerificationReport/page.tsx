import type { Metadata } from "next";
import { ArrowUpDown, ChevronDown, Download, Filter, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Member verification report · AIMSCAMS" };

const columns = [
  "Member Name",
  "Member Id",
  "Verification Status",
  "Date Verified",
  "Verified By",
  "Reference Id",
  "Source Of Initiation",
];

export default function Route() {
  return (
    <div className="space-y-4">
      <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-3">
        <h1 className="fs-title font-semibold text-heading">Member Verification Report</h1>
        <Button
          type="button"
          variant="outline"
          disabled
          aria-describedby="verification-report-export-note"
          title="Export is unavailable until this report has a data source."
          className="h-[38px] gap-2 border-primary px-3 text-primary disabled:opacity-100 disabled:text-primary"
        >
          <Download className="size-4" aria-hidden="true" />
          Download
          <ChevronDown className="size-4" aria-hidden="true" />
        </Button>
      </header>

      <p id="verification-report-export-note" className="sr-only">
        Member verification exports are unavailable because the current API does not provide this report data.
      </p>

      <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left fs-text">
            <thead className="border-b border-card-border bg-subtle font-semibold text-label">
              <tr>
                {columns.map((column) => (
                  <th key={column} scope="col" className="px-3 py-4">
                    <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                      <span>{column}</span>
                      <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                        <button
                          type="button"
                          disabled
                          aria-label={`Sort by ${column}`}
                          title="Sorting is unavailable without report data."
                          className="rounded p-0.5 disabled:cursor-not-allowed disabled:opacity-100"
                        >
                          <ArrowUpDown className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled
                          aria-label={`Filter by ${column}`}
                          title="Filtering is unavailable without report data."
                          className="rounded p-0.5 disabled:cursor-not-allowed disabled:opacity-100"
                        >
                          <Filter className="size-4" aria-hidden="true" />
                        </button>
                      </span>
                    </div>
                  </th>
                ))}
                <th scope="col" className="w-12 px-2 py-3 text-center">
                  <Button type="button" variant="ghost" size="icon-sm" disabled aria-label="Table columns" className="disabled:opacity-100 disabled:text-primary">
                    <SlidersHorizontal className="size-4" aria-hidden="true" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={columns.length + 1} className="h-[240px] px-6 text-center align-middle">
                  <div className="mx-auto max-w-lg space-y-1">
                    <p className="fs-text font-medium text-body">Member verification data is unavailable</p>
                    <p className="fs-caption text-muted-foreground">
                      The current API does not provide verification records or report export access.
                    </p>
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
