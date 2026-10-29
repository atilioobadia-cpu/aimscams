import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTzs } from "@/lib/format";
import { titleCase } from "@/lib/privacy";
import type { RequestItem } from "@/lib/transactions";

type RequestQueueTableProps = {
  items: RequestItem[];
  total: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export function RequestQueueTable({
  items,
  total,
  page,
  pageCount,
  onPageChange,
}: RequestQueueTableProps) {
  return (
    <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left fs-text">
          <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">Request type</th>
              <th className="whitespace-nowrap px-4 py-3">Amount</th>
              <th className="whitespace-nowrap px-4 py-3">Current assignee</th>
              <th className="whitespace-nowrap px-4 py-3">Request status</th>
              <th className="whitespace-nowrap px-4 py-3">Approved by</th>
              <th className="whitespace-nowrap px-4 py-3">Approval date</th>
              <th className="whitespace-nowrap px-4 py-3">Created date</th>
              <th className="whitespace-nowrap px-4 py-3">Request by user</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-card-border last:border-0">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">
                  {titleCase(item.requestType.replace(/[_-]+/g, " "))}
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">
                  {item.amountMinor === null ? "N/A" : formatTzs(item.amountMinor)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-body">{item.currentAssignee}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant={item.status === "PENDING" ? "outline" : "default"}>
                    {titleCase(item.status)}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-body">{item.approvedBy}</td>
                <td className="whitespace-nowrap px-4 py-3 text-body">
                  {item.approvedAt === "N/A"
                    ? "N/A"
                    : new Date(item.approvedAt).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-body">
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-body">{item.requestedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border px-4 py-3 fs-text text-muted-foreground">
        <span>{total} requests</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span>
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
