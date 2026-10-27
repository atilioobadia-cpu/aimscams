"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { AccountingNav } from "@/components/accounting/accounting-nav";
import {
  ErrorPanel,
  ForbiddenPanel,
  PanelSkeleton,
} from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
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
  is_assumption: boolean;
};

function display(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

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

  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader
        title="Chart of accounts"
        description="The institution's ledger accounts and their normal side. Only postable accounts accept journal lines."
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
              {accounts.length} {accounts.length === 1 ? "account" : "accounts"} ·{" "}
              {accounts.filter((account) => account.is_postable).length} postable
            </p>
            <p className="fs-text text-muted-foreground">
              Normal side follows the account, not the last posting.
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-[var(--space-16)]">Code</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Normal side</TableHead>
                <TableHead className="pr-[var(--space-16)] text-right">Postable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="pl-[var(--space-16)] font-medium text-strong">
                    {account.code}
                  </TableCell>
                  <TableCell>
                    <span className="text-body">{account.name}</span>
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
                  <TableCell className="pr-[var(--space-16)] text-right">
                    <Badge variant={account.is_postable ? "secondary" : "outline"}>
                      {account.is_postable ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
}
