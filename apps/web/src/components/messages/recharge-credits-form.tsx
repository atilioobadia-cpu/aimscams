"use client";

import { useState } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RechargeCreditsForm() {
  const [credits, setCredits] = useState("");
  const [description, setDescription] = useState("");
  const amountIsMissing = credits.trim().length === 0;

  return (
    <div className="space-y-4">
      <PageHeader variant="card" title="Recharge Credits" icon={<Wallet className="size-6 text-primary" aria-hidden="true" />} />
      <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-4">
        <div className="max-w-[370px] space-y-3">
          <div className="space-y-1">
            <label htmlFor="credit-amount" className="block fs-text text-label">Credit<span aria-hidden="true">*</span></label>
            <Input
              id="credit-amount"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={credits}
              onChange={(event) => setCredits(event.target.value)}
              aria-required="true"
              aria-invalid={amountIsMissing}
              aria-describedby={amountIsMissing ? "credit-required" : "credit-unpriced"}
              className="h-[42px] border-input"
            />
            {amountIsMissing ? (
              <p id="credit-required" className="fs-text text-destructive">Credit is required.</p>
            ) : (
              <p id="credit-unpriced" className="fs-caption text-muted-foreground">
                Credit pricing is unavailable until the message-credit service is connected.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="credit-description" className="block fs-text text-label">Description</label>
            <Input id="credit-description" value={description} onChange={(event) => setDescription(event.target.value)} className="h-[42px] border-input" />
          </div>
        </div>
        <dl className="mt-4 space-y-5 fs-text text-body">
          <div><dt className="sr-only">WBA Balance</dt><dd>WBA Balance (TSh): <span className="font-medium text-muted-foreground">Unavailable</span></dd></div>
          <div><dt className="sr-only">Total Cost</dt><dd>Total Cost (TSh): <span className="font-medium text-muted-foreground">Unavailable</span></dd></div>
        </dl>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button type="button" disabled title="Purchasing is unavailable until pricing and payment APIs are connected." className="bg-muted text-muted-foreground disabled:opacity-100">
            Buy Credits
          </Button>
          <Button asChild type="button" variant="outline" className="border-primary text-primary">
            <Link href="/messages">Cancel</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
