"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Search, ChevronRight, ChevronDown, Pencil } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

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

const TOP_LEVEL_CODES = new Set(["1", "2", "3", "4", "5"]);

function display(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function formatBalance(value: string, normalBalance: string): string {
  const n = BigInt(value || "0");
  let side: string;
  let abs: bigint;
  if (normalBalance === "debit") {
    side = n >= 0n ? "Dr" : "Cr";
    abs = n >= 0n ? n : -n;
  } else {
    side = n >= 0n ? "Cr" : "Dr";
    abs = n >= 0n ? n : -n;
  }
  const whole = abs / 100n;
  const frac = abs % 100n;
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${side} ${wholeStr}.${frac.toString().padStart(2, "0")}`;
}

export default function ChartOfAccountsPage() {
  const { pushToast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState("");
  const [editParent, setEditParent] = useState("");
  const [editOpening, setEditOpening] = useState("0.00");
  const [editOpeningDc, setEditOpeningDc] = useState("Dr");
  const [editOpeningDate, setEditOpeningDate] = useState("");
  const [editBankCash, setEditBankCash] = useState("");
  const [editReconciliation, setEditReconciliation] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editMaturity, setEditMaturity] = useState("");
  const [editNotes, setEditNotes] = useState("");

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

  const childrenOf = useMemo(() => {
    const map = new Map<string, Account[]>();
    for (const account of accounts) {
      const key = account.parent_id ?? "__root__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(account);
    }
    for (const list of map.values()) list.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
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

  const visibleRows = useMemo(() => {
    if (query.trim()) return filtered;
    const result: Account[] = [];
    const walk = (parentId: string | null) => {
      const key = parentId ?? "__root__";
      const children = childrenOf.get(key) ?? [];
      for (const account of children) {
        result.push(account);
        if (account.is_group && expanded.has(account.id)) {
          walk(account.id);
        }
      }
    };
    walk(null);
    return result;
  }, [childrenOf, expanded, query, filtered]);

  const totalClosing = accounts.reduce((sum, a) => sum + BigInt(a.closing_balance_minor || "0"), 0n);

  const isExpanded = (id: string) => expanded.has(id);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  function openEdit(account: Account) {
    setEditAccount(account);
    setEditName(account.name);
    setEditParent(account.parent_id ?? "");
    setEditOpening(formatBalance(account.opening_balance_minor, account.normal_balance).replace(/^(Dr|Cr) /, ""));
    setEditOpeningDc(account.normal_balance === "debit" ? "Dr" : "Cr");
    setEditOpeningDate("");
    setEditBankCash("");
    setEditReconciliation("");
    setEditCategory("");
    setEditMaturity("");
    setEditNotes("");
  }

  function closeEdit() {
    setEditAccount(null);
  }

  function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    pushToast("Ledger editing arrives with the Accounting phase.");
    closeEdit();
  }

  const parentOptions = accounts.filter((a) => a.is_group);

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
          {totalClosing !== 0n ? (
            <div className="border-b border-accent-yellow/40 bg-accent-yellow-bg px-[var(--space-16)] py-[var(--space-8)] fs-text text-accent-yellow">
              Opening balances do not net to zero (closing total {formatBalance(totalClosing.toString(), "debit")}). Review before posting.
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-[var(--space-16)]">Account name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">O/P balance (TSh)</TableHead>
                  <TableHead className="text-right">C/L balance (TSh)</TableHead>
                  <TableHead className="pr-[var(--space-16)] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((account) => {
                  const depth = depthOf.get(account.id) ?? 0;
                  const isTopLevel = TOP_LEVEL_CODES.has(account.code) && account.parent_id === null;
                  const clickable = account.is_group && !isTopLevel;
                  return (
                    <TableRow key={account.id} className={account.is_group ? "bg-subtle/60" : undefined}>
                      <TableCell style={{ paddingLeft: `${16 + depth * 20}px` }}>
                        <div className="flex items-center gap-1">
                          {account.is_group ? (
                            <button
                              type="button"
                              onClick={() => toggle(account.id)}
                              className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-strong"
                              aria-label={isExpanded(account.id) ? "Collapse group" : "Expand group"}
                            >
                              {isExpanded(account.id) ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </button>
                          ) : (
                            <span className="size-5" />
                          )}
                          {clickable ? (
                            <Link
                              href={`/accounting-ledger-entries?group=${account.code}`}
                              className="font-semibold text-strong hover:underline"
                            >
                              {account.name}
                            </Link>
                          ) : (
                            <span className={account.is_group ? "font-semibold text-strong" : "text-body"}>
                              {account.name}
                            </span>
                          )}
                          {account.is_assumption ? (
                            <Badge
                              variant="outline"
                              className="ml-2 border-accent-yellow/40 bg-accent-yellow-bg text-accent-yellow"
                            >
                              Assumption
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-strong">{account.code}</TableCell>
                      <TableCell className="text-body">{account.is_group ? "Group" : "Ledger"}</TableCell>
                      <TableCell className="text-right tabular-nums text-body">
                        {formatBalance(account.opening_balance_minor, account.normal_balance)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-body">
                        {formatBalance(account.closing_balance_minor, account.normal_balance)}
                      </TableCell>
                      <TableCell className="pr-[var(--space-16)] text-right">
                        {!account.is_group ? (
                          <RowActionsMenu
                            label={`${account.code} ${account.name}`}
                            actions={[
                              { label: "Edit ledger", icon: Pencil, onSelect: () => openEdit(account) },
                            ]}
                          />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <Modal open={editAccount !== null} onClose={closeEdit} title="Ledger details">
        {editAccount ? (
          <form className="space-y-4" onSubmit={saveEdit}>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="edit-name">Name *</label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="edit-parent">Parent group</label>
              <select id="edit-parent" value={editParent} onChange={(e) => setEditParent(e.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text">
                <option value="">None</option>
                {parentOptions.map((g) => (
                  <option key={g.id} value={g.id}>{g.code} {g.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="edit-code">Code</label>
                <Input id="edit-code" value={editAccount.code} readOnly className="h-[var(--control-height)] bg-subtle" />
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="edit-opening">Opening balance</label>
                <Input id="edit-opening" value={editOpening} onChange={(e) => setEditOpening(e.target.value)} className="h-[var(--control-height)]" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="edit-opening-dc">Opening balance DC</label>
                <select id="edit-opening-dc" value={editOpeningDc} onChange={(e) => setEditOpeningDc(e.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text">
                  <option value="Dr">Dr</option>
                  <option value="Cr">Cr</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="edit-opening-date">Opening date</label>
                <Input id="edit-opening-date" type="date" value={editOpeningDate} onChange={(e) => setEditOpeningDate(e.target.value)} className="h-[var(--control-height)]" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="edit-bank-cash">Bank or cash account</label>
                <Input id="edit-bank-cash" value={editBankCash} onChange={(e) => setEditBankCash(e.target.value)} className="h-[var(--control-height)]" />
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="edit-recon">Reconciliation</label>
                <Input id="edit-recon" value={editReconciliation} onChange={(e) => setEditReconciliation(e.target.value)} className="h-[var(--control-height)]" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="edit-category">Category</label>
                <Input id="edit-category" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="h-[var(--control-height)]" />
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="edit-maturity">Maturity date</label>
                <Input id="edit-maturity" type="date" value={editMaturity} onChange={(e) => setEditMaturity(e.target.value)} className="h-[var(--control-height)]" />
              </div>
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="edit-notes">Notes</label>
              <textarea id="edit-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} className="w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] py-[var(--space-8)] fs-text" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeEdit}>Cancel</Button>
              <Button type="submit" className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">Update</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
