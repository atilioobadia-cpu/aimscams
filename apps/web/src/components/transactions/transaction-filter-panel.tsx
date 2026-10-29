import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { AccountingStatus, TransactionStatus } from "@/lib/transactions";

type TransactionFilterPanelProps = {
  query: string;
  status: TransactionStatus | "";
  accountingStatus: AccountingStatus | "";
  from: string;
  to: string;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: TransactionStatus | "") => void;
  onAccountingStatusChange: (value: AccountingStatus | "") => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
};

function transactionStatus(value: string): TransactionStatus | "" {
  if (
    value === "SUBMITTED" ||
    value === "APPROVED" ||
    value === "REVERSED" ||
    value === "CANCELLED"
  ) {
    return value;
  }
  return "";
}

function accountingStatus(value: string): AccountingStatus | "" {
  if (value === "PENDING" || value === "POSTED" || value === "FAILED") return value;
  return "";
}

export function TransactionFilterPanel({
  query,
  status,
  accountingStatus: selectedAccountingStatus,
  from,
  to,
  onQueryChange,
  onStatusChange,
  onAccountingStatusChange,
  onFromChange,
  onToChange,
}: TransactionFilterPanelProps) {
  return (
    <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="sm:col-span-2 xl:col-span-1">
          <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-search">
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="transaction-search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Reference, type or client"
              className="h-[var(--control-height)] pl-9"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-status">
            Transaction status
          </label>
          <select
            id="transaction-status"
            value={status}
            onChange={(event) => onStatusChange(transactionStatus(event.target.value))}
            className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
          >
            <option value="">All statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="REVERSED">Reversed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block fs-text font-medium text-body" htmlFor="accounting-status">
            Accounting status
          </label>
          <select
            id="accounting-status"
            value={selectedAccountingStatus}
            onChange={(event) => onAccountingStatusChange(accountingStatus(event.target.value))}
            className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="POSTED">Posted</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-from">
            From date
          </label>
          <Input
            id="transaction-from"
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="h-[var(--control-height)]"
          />
        </div>
        <div>
          <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-to">
            To date
          </label>
          <Input
            id="transaction-to"
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            className="h-[var(--control-height)]"
          />
        </div>
      </div>
    </section>
  );
}
