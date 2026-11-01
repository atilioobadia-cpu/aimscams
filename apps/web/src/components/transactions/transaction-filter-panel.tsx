import { useState } from "react";
import { ChevronDown, FilterX, Plus, Save, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AccountingStatus, TransactionStatus } from "@/lib/transactions";

type TransactionFilterPanelProps = {
  query: string;
  status: TransactionStatus | "";
  accountingStatus: AccountingStatus | "";
  from: string;
  to: string;
  dateEnabled: boolean;
  accountingEnabled: boolean;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: TransactionStatus | "") => void;
  onAccountingStatusChange: (value: AccountingStatus | "") => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onDateToggle: (enabled: boolean) => void;
  onAccountingToggle: (enabled: boolean) => void;
  onSave: () => void;
  onClear: () => void;
};

function transactionStatus(value: string): TransactionStatus | "" {
  if (value === "SUBMITTED" || value === "APPROVED" || value === "REVERSED" || value === "CANCELLED") return value;
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
  dateEnabled,
  accountingEnabled,
  onQueryChange,
  onStatusChange,
  onAccountingStatusChange,
  onFromChange,
  onToChange,
  onDateToggle,
  onAccountingToggle,
  onSave,
  onClear,
}: TransactionFilterPanelProps) {
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);

  return (
    <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-[240px] sm:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="Search transactions"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search"
            className="h-[var(--control-height)] !border-primary pl-9"
          />
        </div>

        {dateEnabled ? (
          <div className="relative flex items-center rounded-[var(--control-radius)] border border-primary">
            <Button type="button" variant="ghost" className="h-[var(--control-height)] gap-2 !text-primary" aria-expanded={dateMenuOpen} onClick={() => setDateMenuOpen((open) => !open)}>
              Date <ChevronDown aria-hidden="true" />
            </Button>
            <button type="button" aria-label="Remove date filter" title="Remove date filter" onClick={() => { onDateToggle(false); setDateMenuOpen(false); }} className="grid size-8 place-items-center rounded-r-[var(--control-radius)] text-primary hover:bg-subtle">
              <X className="size-4" aria-hidden="true" />
            </button>
            {dateMenuOpen ? (
              <div className="absolute left-0 top-full z-20 mt-1 grid w-[300px] gap-3 rounded-md border border-card-border bg-surface p-3 shadow-lg">
                <label className="grid gap-1 fs-text text-body">From date<Input type="date" value={from} onChange={(event) => onFromChange(event.target.value)} className="h-[var(--control-height)]" /></label>
                <label className="grid gap-1 fs-text text-body">To date<Input type="date" value={to} onChange={(event) => onToChange(event.target.value)} className="h-[var(--control-height)]" /></label>
              </div>
            ) : null}
          </div>
        ) : null}

        <select
          aria-label="Transaction status"
          value={status}
          onChange={(event) => onStatusChange(transactionStatus(event.target.value))}
          style={{ width: 175 }}
          className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-primary bg-background px-3 fs-text sm:w-[175px]"
        >
          <option value="">Transaction status</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="REVERSED">Reversed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <div className="relative w-full sm:w-[166px]">
          <Button type="button" variant="outline" aria-expanded={filterMenuOpen} aria-controls="transaction-extra-filters" className="w-full justify-between !border-primary !text-primary" onClick={() => setFilterMenuOpen((open) => !open)}>
            <span className="inline-flex items-center gap-2"><Plus aria-hidden="true" />Add filters</span>
            <ChevronDown aria-hidden="true" />
          </Button>
          {filterMenuOpen ? (
            <div id="transaction-extra-filters" role="group" aria-label="Additional transaction filters" className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-card-border bg-surface p-2 shadow-lg">
              {!dateEnabled ? <button type="button" className="flex w-full items-center gap-2 rounded px-2 py-2 text-left fs-text hover:bg-subtle" onClick={() => { onDateToggle(true); setFilterMenuOpen(false); }}>Date</button> : null}
              <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 fs-text hover:bg-subtle">
                <input type="checkbox" checked={accountingEnabled} onChange={(event) => onAccountingToggle(event.target.checked)} />
                Accounting status
              </label>
            </div>
          ) : null}
        </div>

        <Button type="button" variant="outline" size="icon-lg" aria-label="Save current filters" title="Save current filters" className="!size-[36px] !border-primary !text-primary" onClick={onSave}><Save aria-hidden="true" /></Button>
        <Button type="button" variant="outline" size="icon-lg" aria-label="Clear filters" title="Clear filters" className="!size-[36px] !border-primary !text-primary" onClick={onClear}><FilterX aria-hidden="true" /></Button>
      </div>
      {accountingEnabled ? (
        <div className="mt-3 w-full sm:w-[180px]">
          <select aria-label="Accounting status" value={selectedAccountingStatus} onChange={(event) => onAccountingStatusChange(accountingStatus(event.target.value))} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-primary bg-background px-3 fs-text">
            <option value="">Accounting status</option>
            <option value="PENDING">Pending</option>
            <option value="POSTED">Posted</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      ) : null}
    </section>
  );
}
