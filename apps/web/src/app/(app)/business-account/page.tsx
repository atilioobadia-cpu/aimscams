"use client";

import { useState } from "react";
import { Download, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const TABS = [
  "Collection and disbursements",
  "Quick loan",
  "Expenditure",
  "Transactions",
  "Fee settings",
  "Invoices",
];

const FUND_TYPES = ["Top Up", "Deposit", "QuickLoan Top Up"] as const;

type FundType = (typeof FUND_TYPES)[number];

export default function BusinessAccountPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [fundType, setFundType] = useState<FundType>("Top Up");
  const [addFundsOpen, setAddFundsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-[var(--space-8)]">
      <section className="flex flex-col gap-5 rounded-[var(--card-radius)] border border-card-border bg-card px-[var(--space-16)] py-[var(--space-12)] xl:flex-row xl:items-center xl:gap-[var(--space-16)]">
        <div className="flex min-w-0 flex-1 items-center gap-[var(--space-12)]">
          <div aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#057573] bg-[#29aae3] text-[12.8px] font-bold text-white">
            MM
          </div>
          <div className="min-w-0">
            <p className="fs-text font-semibold text-heading">Business account</p>
            <p className="fs-text text-muted-foreground">Account details unavailable</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-[var(--space-24)] gap-y-3">
          {[
            ["Fees wallet (TSh)", "Unavailable"],
            ["Due amount (TSh)", "Unavailable"],
            ["Status", "Unavailable"],
          ].map(([label, value]) => (
            <div className="min-w-24 text-left xl:text-center" key={label}>
              <p className="fs-text text-muted-foreground">{label}</p>
              <p className="fs-text font-semibold text-heading">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-[var(--space-8)]">
          <Button
            className="h-[var(--control-height)] gap-[var(--space-6)] px-[var(--space-12)] fs-text font-semibold"
            onClick={() => setAddFundsOpen(true)}
          >
            <Plus aria-hidden="true" className="size-4" />
            Add funds
          </Button>
          <Button
            className="h-[var(--control-height)] gap-[var(--space-6)] px-[var(--space-12)] fs-text font-semibold"
            disabled
            variant="outline"
          >
            <Download aria-hidden="true" className="size-4" />
            Statement download
          </Button>
        </div>
      </section>

      <nav aria-label="Business account sections" className="flex flex-wrap gap-[var(--space-6)]">
        {TABS.map((tab) => {
          const selected = activeTab === tab;
          return (
            <button
              aria-current={selected ? "page" : undefined}
              className={
                selected
                  ? "rounded-[var(--control-radius)] bg-primary px-[var(--space-12)] py-[var(--space-6)] fs-text font-semibold text-on-primary"
                  : "rounded-[var(--control-radius)] bg-subtle px-[var(--space-12)] py-[var(--space-6)] fs-text font-medium text-heading hover:bg-muted"
              }
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          );
        })}
      </nav>

      <section aria-label="Invoices" className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-[var(--space-12)]">Invoice Date</TableHead>
                <TableHead>Invoice Id</TableHead>
                <TableHead>Invoice Number</TableHead>
                <TableHead className="text-right">Invoice Amount (TSh)</TableHead>
                <TableHead className="text-right">Discount (TSh)</TableHead>
                <TableHead className="pr-[var(--space-16)] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="py-[var(--space-24)] text-center fs-text text-muted-foreground">
                  No invoice data available
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="border-t border-card-border px-[var(--space-12)] py-[var(--space-8)] fs-text text-muted-foreground">
          Tariffs and charges are unavailable.
        </div>
      </section>

      <Dialog onOpenChange={setAddFundsOpen} open={addFundsOpen}>
        <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-[12px] p-0 sm:max-w-2xl" showCloseButton={false}>
          <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
            <DialogTitle className="fs-text text-heading">Add Funds</DialogTitle>
            <DialogClose asChild>
              <button aria-label="Close" className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-heading" type="button">
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            </DialogClose>
          </div>

          <div className="min-h-0 space-y-5 overflow-y-auto px-5 py-5">
            <fieldset className="flex flex-wrap gap-x-5 gap-y-3" aria-label="Fund type">
              {FUND_TYPES.map((option) => (
                <label className="flex cursor-pointer items-center gap-2 fs-text text-heading" key={option}>
                  <input
                    checked={fundType === option}
                    className="size-5 accent-primary"
                    name="fundType"
                    onChange={() => setFundType(option)}
                    type="radio"
                    value={option}
                  />
                  {option}
                </label>
              ))}
            </fieldset>

            <div className="space-y-2">
              <label className="fs-text font-medium text-heading" htmlFor="fund-amount">Amount <span className="text-destructive">*</span></label>
              <Input autoComplete="off" id="fund-amount" inputMode="decimal" placeholder="Enter amount to add" />
            </div>
            <div className="space-y-2">
              <label className="fs-text font-medium text-heading" htmlFor="fund-payer">Payer <span className="text-destructive">*</span></label>
              <Input autoComplete="off" id="fund-payer" placeholder="payer name" />
            </div>
            <div className="space-y-2">
              <label className="fs-text font-medium text-heading" htmlFor="fund-provider">Provider <span className="text-destructive">*</span></label>
              <select className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-card px-[var(--space-12)] fs-text text-muted-foreground" defaultValue="" id="fund-provider">
                <option disabled value="">select a provider</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="fs-text font-medium text-heading" htmlFor="fund-message">Message</label>
              <Textarea className="min-h-20 resize-y" id="fund-message" placeholder="transaction message" />
            </div>
            <p className="fs-text text-muted-foreground">Adding funds is unavailable until a business account and payment provider are connected.</p>
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-card-border px-5 py-4">
            <DialogClose asChild>
              <Button className="text-primary hover:bg-primary/5" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button disabled>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
