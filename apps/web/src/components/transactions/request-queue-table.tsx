import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTzs } from "@/lib/format";
import { titleCase } from "@/lib/privacy";
import type { RequestItem } from "@/lib/transactions";

type RequestQueueTableProps = {
  items: RequestItem[];
  total: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  stateContent?: React.ReactNode;
};

function displayDate(value: string | null | undefined) {
  if (!value || value === "N/A") return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "N/A" : date.toLocaleDateString();
}

export function RequestQueueTable({
  items,
  total,
  page,
  pageCount,
  onPageChange,
  stateContent,
}: RequestQueueTableProps) {
  const columns = [
    "Request by User",
    "Request Type",
    "Amount",
    "Current Assignee",
    "Approved by",
    "Request Status",
    "Approval Date",
    "Created Date",
  ];

  return (
    <section id="request-results" className="overflow-hidden border-b border-card-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] table-auto text-left fs-text">
          <thead className="h-[47px] border-b border-card-border bg-subtle text-heading">
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="whitespace-nowrap px-4 font-semibold">
                  {column}
                </th>
              ))}
              <th scope="col" className="w-10 px-3">
                <span className="sr-only">Actions</span>
                <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
              </th>
            </tr>
          </thead>
          <tbody>
            {stateContent ? (
              <tr>
                <td colSpan={9} className="p-0 text-center">
                  {stateContent}
                </td>
              </tr>
            ) : items.map((item) => (
              <tr key={item.id} className="h-[62px] border-b border-card-border last:border-0 hover:bg-subtle">
                <td className="whitespace-nowrap px-4 text-body">{item.requestedBy}</td>
                <td className="whitespace-nowrap px-4 font-medium text-strong">{titleCase(item.requestType.replace(/[_-]+/g, " "))}</td>
                <td className="whitespace-nowrap px-4 tabular-nums text-body">{item.amountMinor === null ? "N/A" : formatTzs(item.amountMinor)}</td>
                <td className="whitespace-nowrap px-4 text-body">{item.currentAssignee}</td>
                <td className="whitespace-nowrap px-4 text-body">{item.approvedBy}</td>
                <td className="whitespace-nowrap px-4">
                  <Badge variant={item.status === "PENDING" ? "outline" : "default"}>{titleCase(item.status)}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 text-body">{displayDate(item.approvedAt)}</td>
                <td className="whitespace-nowrap px-4 text-body">{displayDate(item.createdAt)}</td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!stateContent && items.length > 0 ? (
        <div className="flex min-h-[58px] items-center justify-between gap-3 border-t border-card-border px-4 fs-text text-muted-foreground">
          <span>Showing {(page - 1) * 20 + 1} to {(page - 1) * 20 + items.length} of {total} entries</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
            <span>{page} / {pageCount}</span>
            <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>Next</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}