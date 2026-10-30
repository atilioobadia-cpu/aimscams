"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Search } from "lucide-react";

import { AccountingNav } from "@/components/accounting/accounting-nav";
import {
  ErrorPanel,
  ForbiddenPanel,
  PanelSkeleton,
} from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, apiRequest } from "@/lib/api";

type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
  normal_balance: string;
  is_postable: boolean;
  is_group: boolean;
  is_assumption: boolean;
  parent_id: string | null;
  opening_balance_minor: string;
  closing_balance_minor: string;
};

function display(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function minorToMajor(value: string): string {
  const n = BigInt(value || "0");
  const whole = n / 100n;
  const frac = (n < 0n ? -n : n) % 100n;
  return `${whole}.${frac.toString().padStart(2, "0")}`;
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setForbidden(false);
    setError(null);
    apiRequest<Account[]>("/accounting/chart-of-accounts")
      .then((data) => {
        if (!active) return;
        setAccounts(data);
        setLoading(false);
      })
      .catch((failure) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 403) {
          setForbidden(true);
        } else {
          setError(
            failure instanceof Error && failure.message
              ? failure.message
              : "Could not load the chart of accounts.",
          );
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  const byId = useMemo(() => {
    const map = new Map<string, Account>();
    for (const account of accounts) map.set(account.id, account);
    return map;
  }, [accounts]);

  const depthOf = useMemo(() => {
    const depth = new Map<string, number>();
    const compute = (account: Account): number => {
      if (depth.has(account.id)) return depth.get(account.id)!;
      if (!account.parent_id) {
        depth.set(account.id, 0);
        return 0;
      }
      const parent = byId.get(account.parent_id);
      const d = parent ? compute(parent) + 1 : 0;
      depth.set(account.id, d);
      return d;
    };
    for (const account of accounts) compute(account);
    return depth;
  }, [accounts, byId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (account) =>
        account.code.toLowerCase().includes(q) ||
        account.name.toLowerCase().includes(q) ||
        account.type.toLowerCase().includes(q),
    );
  }, [accounts, query]);

  const totalClosing = accounts.reduce((sum, a) => sum + BigInt(a.closing_balance_minor || "0"), 0n);

  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader
        title="Chart of accounts"
        description="The institution's ledger accounts, grouped. Only postable accounts accept journal lines."
        breadcrumb={
          <Link href="/accounting" className="hover:text-brand">
            Accounting
          </Link>
        }
      />

      <AccountingNav />

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view the chart of accounts. Ask an administrator for Settings Accounting : View." />
      ) : loading ? (
        <PanelSkeleton rows={8} />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setRefresh((value) => value + 1)} />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No ledger account yet"
          description="Seed the institution's chart of accounts before posting any entry."
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-card-border px-[var(--space-16)] py-[var(--space-10)]">
            <p className="fs-text text-muted-foreground">
              {accounts.length} accounts · {accounts.filter((a) => a.is_postable).length} postable ·{" "}
              {accounts.filter((a) => a.is_group).length} groups
            </p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search code or name"
                  className="h-[var(--control-height)] w-64 pl-8"
                />
              </div>
            </div>
          </div>
          {BigInt(totalClosing) !== 0n ? (
            <div className="border-b border-accent-yellow/40 bg-accent-yellow-bg px-[var(--space-16)] py-[var(--space-8)] fs-text text-accent-yellow">
              Opening balances do not net to zero (closing total {minorToMajor(totalClosing.toString())}). Review before posting.
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-[var(--space-16)]">Code</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Normal side</TableHead>
                  <TableHead className="text-right">O/P balance</TableHead>
                  <TableHead className="text-right">C/L balance</TableHead>
                  <TableHead className="pr-[var(--space-16)] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((account) => {
                  const depth = depthOf.get(account.id) ?? 0;
                  return (
                    <TableRow key={account.id} className={account.is_group ? "bg-subtle/60" : undefined}>
                      <TableCell className="pl-[var(--space-16)] font-medium text-strong">
                        {account.code}
                      </TableCell>
                      <TableCell style={{ paddingLeft: `${16 + depth * 16}px` }}>
                        <span className={account.is_group ? "font-semibold text-strong" : "text-body"}>
                          {account.name}
                        </span>
                        {account.is_assumption ? (
                          <Badge
                            variant="outline"
                            className="ml-2 border-accent-yellow/40 bg-accent-yellow-bg text-accent-yellow"
                          >
                            Assumption
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-body">{display(account.type)}</TableCell>
                      <TableCell className="text-body">{display(account.normal_balance)}</TableCell>
                      <TableCell className="text-right tabular-nums text-body">
                        {minorToMajor(account.opening_balance_minor)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-body">
                        {minorToMajor(account.closing_balance_minor)}
                      </TableCell>
                      <TableCell className="pr-[var(--space-16)] text-right">
                        <RowActionsMenu
                          label={`${account.code} ${account.name}`}
                          actions={[
                            { label: "View ledger", href: `/accounting-ledger-entries?account=${account.code}` },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
