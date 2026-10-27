"use client";

import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
  normal_balance: string;
  is_postable: boolean;
  is_assumption: boolean;
};

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<Account[]>("/accounting/chart-of-accounts")
      .then((data) => {
        if (!active) return;
        setAccounts(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load chart of accounts.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[var(--fs)] font-bold leading-tight text-strong">Chart of accounts</h1>
        <p className="mt-1 text-[var(--font-size-secondary)] text-muted-foreground">
          Institution chart of accounts.
        </p>
      </div>

      {error ? (
        <div className="rounded-[var(--card-radius)] border border-accent-red-bg bg-accent-red-bg px-4 py-3 text-[var(--font-size-secondary)] text-accent-red">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[var(--font-size-micro)]">
            <thead className="border-b border-card-border bg-subtle text-[var(--font-size-micro)] font-semibold uppercase tracking-wide text-label">
              <tr>
                <th className="px-[var(--space-16)] py-[var(--space-8)]">Code</th>
                <th className="px-[var(--space-16)] py-[var(--space-8)]">Name</th>
                <th className="px-[var(--space-16)] py-[var(--space-8)]">Type</th>
                <th className="px-[var(--space-16)] py-[var(--space-8)]">Normal balance</th>
                <th className="px-[var(--space-16)] py-[var(--space-8)]">Postable</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-[var(--space-16)] py-[var(--space-16)] text-center text-muted-foreground">
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-[var(--space-16)] py-[var(--space-16)] text-center text-muted-foreground">
                    No accounts found.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id} className="border-b border-card-border last:border-0">
                    <td className="px-[var(--space-16)] py-[var(--space-8)] font-medium text-strong">{account.code}</td>
                    <td className="px-[var(--space-16)] py-[var(--space-8)] text-body">
                      {account.name}
                      {account.is_assumption ? (
                        <span className="ml-2 rounded-full bg-accent-yellow-bg px-2 py-0.5 text-[var(--font-size-micro)] font-semibold text-accent-yellow">
                          assumption
                        </span>
                      ) : null}
                    </td>
                    <td className="px-[var(--space-16)] py-[var(--space-8)] text-body">{account.type}</td>
                    <td className="px-[var(--space-16)] py-[var(--space-8)] text-body">{account.normal_balance}</td>
                    <td className="px-[var(--space-16)] py-[var(--space-8)] text-body">{account.is_postable ? "Yes" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

