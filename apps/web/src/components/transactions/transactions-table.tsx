import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTzs } from "@/lib/format";
import { titleCase } from "@/lib/privacy";
import type { Transaction } from "@/lib/transactions";

type TransactionsTableProps = {
  items: Transaction[];
  total: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

function statusVariant(status: string): "default" | "outline" | "destructive" {
  if (status === "FAILED" || status === "REVERSED" || status === "CANCELLED") {
    return "destructive";
  }
  if (status === "PENDING" || status === "SUBMITTED") return "outline";
  return "default";
}

function transactionLabel(value: string): string {
  return titleCase(value.replace(/[_-]+/g, " "));
}

export function TransactionsTable({
  items,
  total,
  page,
  pageCount,
  onPageChange,
}: TransactionsTableProps) {
  return (
    <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px] text-left fs-text">
          <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">Reference</th>
              <th className="whitespace-nowrap px-4 py-3">Client</th>
              <th className="whitespace-nowrap px-4 py-3">Transaction type</th>
              <th className="whitespace-nowrap px-4 py-3">Amount</th>
              <th className="whitespace-nowrap px-4 py-3">Payment method</th>
              <th className="whitespace-nowrap px-4 py-3">Transaction status</th>
              <th className="whitespace-nowrap px-4 py-3">Accounting status</th>
              <th className="whitespace-nowrap px-4 py-3">Value date</th>
              <th className="whitespace-nowrap px-4 py-3">Teller</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-card-border last:border-0">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">
                  {item.transactionNo}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-body">
                  <span className="block">{item.clientName}</span>
                  <span className="text-muted-foreground">{item.clientReference}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-body">
                  {transactionLabel(item.type)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">
                  <span className="inline-flex items-center gap-1.5">
                    {item.drCr === "DR" ? (
                      <ArrowDownLeft className="size-3.5 text-accent-red" aria-label="Debit" />
                    ) : (
                      <ArrowUpRight className="size-3.5 text-brand" aria-label="Credit" />
                    )}
                    {formatTzs(item.amountMinor)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-body">
                  {transactionLabel(item.paymentMethod)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant={statusVariant(item.status)}>{titleCase(item.status)}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant={statusVariant(item.accountingStatus)}>
                    {titleCase(item.accountingStatus)}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-body">{item.valueDate}</td>
                <td className="whitespace-nowrap px-4 py-3 text-body">{item.tellerName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border px-4 py-3 fs-text text-muted-foreground">
        <span>{total} transactions</span>
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
