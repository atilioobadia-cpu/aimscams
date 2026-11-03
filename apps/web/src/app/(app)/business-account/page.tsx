"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Download, Info, Plus, Search, SlidersHorizontal } from "lucide-react";

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

function BusinessAccountTable({ columns, search, filters = false, onSearch, toolbarEnd }: { columns: string[]; search: string; filters?: boolean; onSearch?: (value: string) => void; toolbarEnd?: ReactNode }) {
  const [showFilterInfo, setShowFilterInfo] = useState(false);
  return (
    <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-card-border p-4">
        <label className="relative block w-full max-w-[260px]">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search business account transactions" className="h-[42px] pl-9" placeholder="Search" value={search} onChange={(event) => onSearch?.(event.target.value)} readOnly={!onSearch} />
        </label>
        {filters ? <button type="button" onClick={() => setShowFilterInfo((open) => !open)} className="inline-flex h-[42px] items-center gap-2 rounded-[var(--control-radius)] border border-primary px-3 fs-text font-medium text-primary hover:bg-primary/5"><Plus aria-hidden="true" className="size-4" />Add Filters<ChevronDown aria-hidden="true" className="size-4" /></button> : null}
        {toolbarEnd ? <div className="ml-auto">{toolbarEnd}</div> : null}
        {showFilterInfo ? <span className="fs-small text-muted-foreground">Filters are unavailable until business transaction data is connected.</span> : null}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>{columns.map((column) => <TableHead className="whitespace-nowrap" key={column}>{column}</TableHead>)}<TableHead className="w-12 text-center"><SlidersHorizontal aria-label="Table columns" className="mx-auto size-4" /></TableHead></TableRow></TableHeader>
          <TableBody><TableRow><TableCell colSpan={columns.length + 1} className="h-48 text-center fs-text text-muted-foreground">No data available</TableCell></TableRow></TableBody>
        </Table>
      </div>
    </section>
  );
}

export default function BusinessAccountPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [fundType, setFundType] = useState<FundType>("Top Up");
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [convenienceFee, setConvenienceFee] = useState(false);

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

      <nav aria-label="Business account sections" role="tablist" className="flex flex-wrap border-b border-card-border bg-subtle">
        {TABS.map((tab) => {
          const selected = activeTab === tab;
          return (
            <button
              aria-selected={selected}
              role="tab"
              className={
                selected
                  ? "border-b-2 border-primary bg-card px-5 py-3 fs-text font-semibold text-primary"
                  : "border-b-2 border-transparent px-5 py-3 fs-text font-medium text-heading hover:bg-muted"
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

      {activeTab === "Invoices" ? <section aria-label="Invoices" className="space-y-4 rounded-[var(--card-radius)] border border-card-border bg-card p-4">
        <div className="overflow-hidden rounded-[var(--card-radius)] border border-card-border">
          <div className="overflow-x-auto"><Table><TableHeader><TableRow>{["Invoice Date", "Invoice Id", "Invoice Number", "Name", "Status", "Duration", "Created At", "Invoice Amount (TSh)", "Discount (TSh)", "Action"].map((column) => <TableHead className="whitespace-nowrap" key={column}>{column}</TableHead>)}</TableRow></TableHeader><TableBody><TableRow><TableCell colSpan={10} className="h-32 text-center fs-text text-muted-foreground">No invoice data available</TableCell></TableRow></TableBody></Table></div>
        </div>
        <p className="fs-text text-muted-foreground">Tariffs and charges are unavailable.</p>
      </section> : null}

      {activeTab === "Collection and disbursements" ? <div className="space-y-4">
        <div className="flex flex-wrap gap-3"><div className="min-w-56 rounded-[var(--card-radius)] border border-card-border bg-card p-4 text-right"><p className="fs-text text-muted-foreground">Balance</p><p className="fs-text font-semibold text-heading">Unavailable</p></div><div className="min-w-56 rounded-[var(--card-radius)] border border-card-border bg-card p-4 text-right"><p className="fs-text text-muted-foreground">Pending Settlement</p><p className="fs-text font-semibold text-heading">Unavailable</p></div></div>
        <div role="status" className="flex items-center gap-2 rounded-[var(--control-radius)] bg-amber-50 px-4 py-3 fs-text text-amber-800"><Info aria-hidden="true" className="size-4 shrink-0" />Wallet settlement information is unavailable until the business account service is connected.</div>
        <BusinessAccountTable search={search} onSearch={setSearch} columns={["Timestamp", "Transaction Id", "Status", "Settlement", "Type", "Description", "Amount (TSh)"]} />
      </div> : null}

      {activeTab === "Quick loan" ? <div className="space-y-4">
        <div className="flex flex-wrap gap-3">{["Balance", "Pending Settlement"].map((label) => <div key={label} className="min-w-56 rounded-[var(--card-radius)] border border-card-border bg-card p-4 text-right"><p className="fs-text text-muted-foreground">{label}</p><p className="fs-text font-semibold text-heading">Unavailable</p></div>)}</div>
        <BusinessAccountTable search={search} onSearch={setSearch} filters columns={["Timestamp", "Transaction Id", "Status", "Settlement", "Type", "Description", "Amount (TSh)"]} />
      </div> : null}

      {activeTab === "Expenditure" ? <BusinessAccountTable search={search} onSearch={setSearch} toolbarEnd={<label className="flex items-center gap-2 fs-text text-heading">Convenience Fee<input type="checkbox" checked={convenienceFee} onChange={(event) => setConvenienceFee(event.target.checked)} className="size-5 accent-primary" /></label>} columns={["Timestamp", "Transaction ID", "Status", "Type", "Client/Member", "Description", "Amount (TSh)"]} /> : null}

      {activeTab === "Transactions" ? <BusinessAccountTable search={search} onSearch={setSearch} filters columns={["Timestamp", "Transaction ID", "Status", "Type", "Description", "Amount (TSh)"]} /> : null}

      {activeTab === "Fee settings" ? <section aria-label="Fee settings" className="space-y-5 rounded-[var(--card-radius)] border border-card-border bg-card p-6">
        <h2 className="fs-text font-semibold text-heading">Accounting Setting</h2>
        {[{title:"Business account ledger",description:"Ledger used for inward business account transactions.",code:"Unavailable",name:"Unavailable"},{title:"Expense account",description:"Transaction charges paid by the institution are recorded under this ledger.",code:"Unavailable",name:"Unavailable"},{title:"Liability account",description:"Transaction charges paid by members are recorded under this ledger.",code:"Unavailable",name:"Unavailable"}].map((item) => <div key={item.title} className="space-y-4 border-b border-card-border pb-5 last:border-0"><div><h3 className="fs-text font-semibold text-heading">{item.title}</h3><p className="mt-1 flex items-center gap-2 fs-text text-muted-foreground"><Info aria-hidden="true" className="size-4" />{item.description}</p></div><div className="grid gap-4 md:grid-cols-2"><div><p className="fs-text font-semibold text-label">Ledger Code</p><p className="mt-1 fs-text text-body">{item.code}</p></div><div><p className="fs-text font-semibold text-label">Ledger Name</p><p className="mt-1 fs-text text-body">{item.name}</p></div></div>{item.title === "Expense account" ? <Button variant="outline" disabled>Move fees to system expense</Button> : null}</div>)}
      </section> : null}

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
