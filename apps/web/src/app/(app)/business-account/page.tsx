"use client";

import { BookOpen, Plus } from "lucide-react";

import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TABS = [
  "Collection and disbursements",
  "Quick loan",
  "Expenditure",
  "Transactions",
  "Fee settings",
  "Invoices",
];

export default function BusinessAccountPage() {
  return (
    <div className="flex flex-col gap-[var(--space-8)]">
      <PageHeader
        title="Business account"
        description="The institution's own bank and cash accounts."
      />

      {/* Wallet card */}
      <section className="flex items-center gap-[var(--space-16)] rounded-[var(--card-radius)] border border-card-border bg-card px-[var(--space-16)] py-[var(--space-12)]">
        <div className="grid size-10 place-items-center rounded-full border-2 border-[#057573] bg-[#29aae3] text-[12.8px] font-bold text-white">
          MM
        </div>
        <div className="min-w-0 flex-1">
          <p className="fs-text font-semibold text-heading">MFSL MFI</p>
          <p className="fs-text text-muted-foreground">Account ID: 101457</p>
        </div>
        <div className="flex items-center gap-[var(--space-24)]">
          <div className="text-center">
            <p className="fs-text text-muted-foreground">Fees wallet (TSh)</p>
            <p className="fs-text font-semibold text-heading">0.00</p>
          </div>
          <div className="text-center">
            <p className="fs-text text-muted-foreground">Due amount (TSh)</p>
            <p className="fs-text font-semibold text-heading">4,200.00</p>
          </div>
          <div className="text-center">
            <p className="fs-text text-muted-foreground">Status</p>
            <p className="fs-text font-semibold text-primary">ACTIVE</p>
          </div>
        </div>
        <div className="flex items-center gap-[var(--space-8)]">
          <Button className="h-[var(--control-height)] gap-[var(--space-6)] px-[var(--space-12)] fs-text font-semibold">
            <Plus className="size-4" aria-hidden="true" />
            Add funds
          </Button>
          <Button variant="outline" className="h-[var(--control-height)] px-[var(--space-12)] fs-text font-semibold">
            Statement download
          </Button>
        </div>
      </section>

      {/* Tab buttons */}
      <div className="flex flex-wrap gap-[var(--space-6)]">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            className={
              i === 0
                ? "rounded-[var(--control-radius)] bg-primary px-[var(--space-12)] py-[var(--space-6)] fs-text font-semibold text-on-primary"
                : "rounded-[var(--control-radius)] bg-subtle px-[var(--space-12)] py-[var(--space-6)] fs-text font-medium text-heading"
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Balance + Pending Settlement */}
      <div className="flex gap-[var(--space-24)]">
        <div className="flex items-center gap-[var(--space-8)]">
          <span className="fs-text text-muted-foreground">Balance</span>
          <span className="fs-text font-semibold text-heading">0.00</span>
        </div>
        <div className="flex items-center gap-[var(--space-8)]">
          <span className="fs-text text-muted-foreground">Pending settlement</span>
          <span className="fs-text font-semibold text-heading">0.00</span>
        </div>
      </div>

      {/* Warning banner */}
      <div className="rounded-[var(--card-radius)] bg-accent-red-bg px-[var(--space-12)] py-[var(--space-8)] fs-text text-accent-red">
        Your wallet balance is low. Please top up your wallet.
      </div>

      {/* Note */}
      <div className="rounded-[var(--card-radius)] bg-accent-yellow-bg px-[var(--space-12)] py-[var(--space-8)] fs-text text-accent-yellow">
        Please note that only the amount shown in the wallet can be used for business transactions.
      </div>

      {/* Search */}
      <div className="flex items-center gap-[var(--space-8)]">
        <span className="fs-text text-muted-foreground">Search</span>
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-[var(--space-12)]">Timestamp</TableHead>
              <TableHead>Transaction id</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Settlement</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="pr-[var(--space-16)] text-right">Amount (TSh)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="py-[var(--space-24)] text-center fs-text text-muted-foreground">
                No data available
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
