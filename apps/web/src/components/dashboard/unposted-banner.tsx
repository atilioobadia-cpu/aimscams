"use client";

import { Clock3, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DashboardFixture } from "@/lib/fixtures/dashboard";
import { formatTzs } from "@/lib/format";

export function UnpostedBanner({ unposted }: { unposted: DashboardFixture["unposted"] }) {
  return (
    <section
      data-testid="unposted-banner"
      aria-label="Unposted transactions"
      className="flex h-[54px] flex-wrap items-center gap-4 rounded-[var(--card-radius)] border border-accent-yellow/50 bg-accent-yellow-bg px-[var(--space-14)]"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-accent-yellow/40 bg-surface text-accent-yellow">
        <Clock3 className="size-4" strokeWidth={2} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="fs-text font-semibold leading-tight text-strong">
          {unposted.count} transactions are waiting to be posted
        </p>
        <p className="mt-1 fs-text text-body">
          Oldest item: {unposted.oldestAge}. Post before the branch close to keep the till
          reconciled.
        </p>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button type="button" data-testid="unposted-review" className="h-8 px-[var(--space-14)]">
            Review queue
          </Button>
        </SheetTrigger>
        <SheetContent
          data-testid="unposted-sheet"
          className="p-6 data-[side=right]:w-[448px] data-[side=right]:max-w-[100vw] data-[side=right]:sm:max-w-[448px]"
        >
          <SheetHeader className="p-0 pr-10">
            <SheetTitle className="fs-text font-bold text-strong">Unposted transactions</SheetTitle>
            <SheetDescription>
              {unposted.count} items are staged at this branch. Posting is enabled with the
              Transactions module.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-2 overflow-hidden rounded-lg border border-card-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-subtle hover:bg-subtle">
                  <TableHead className="h-10 px-3 fs-text uppercase tracking-wide text-muted-foreground">
                    Item
                  </TableHead>
                  <TableHead className="h-10 px-3 text-right fs-text uppercase tracking-wide text-muted-foreground">
                    Amount
                  </TableHead>
                  <TableHead className="h-10 px-3 text-right fs-text uppercase tracking-wide text-muted-foreground">
                    Age
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unposted.items.map((item) => (
                  <TableRow key={item.reference}>
                    <TableCell className="px-3 py-3">
                      <span className="block font-medium text-strong">{item.kind}</span>
                      <span className="mt-0.5 block fs-text text-muted-foreground">
                        {item.reference}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right font-medium text-strong">
                      {formatTzs(item.amount)}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      <Badge variant="outline" className="text-muted-foreground">
                        {item.age}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-subtle p-3 fs-text text-body">
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0 text-accent-yellow"
              aria-hidden="true"
            />
            Unposted items do not affect the ledger until they are posted.
          </div>

          <SheetFooter className="mt-auto p-0">
            <SheetClose asChild>
              <Button type="button" variant="outline" className="h-11">
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  );
}

