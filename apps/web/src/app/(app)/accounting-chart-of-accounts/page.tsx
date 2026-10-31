"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Calendar, ChevronDown, ChevronRight, Pencil, Plus } from "lucide-react";

import {
  ErrorPanel,
  ForbiddenPanel,
  PanelSkeleton,
} from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
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

const ACRONYMS = new Set(["CRDB", "NMB", "AIMSCAMS", "MFI", "TCDC", "BOT", "MSP", "TSH", "GPS", "HR"]);

function sentenceCase(s: string): string {
  const parts = s.split(/(\s+)/);
  let firstWord = true;
  return parts
    .map((part) => {
      if (!part.trim()) return part;
      const upper = part.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      if (firstWord) {
        firstWord = false;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }
      return part.toLowerCase();
    })
    .join("");
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

  const visibleRows = useMemo(() => {
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
  }, [childrenOf, expanded]);

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
    setEditName(sentenceCase(account.name));
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

  const openingDifference = accounts.reduce(
    (sum, account) =>
      sum +
      (account.normal_balance === "debit"
        ? BigInt(account.opening_balance_minor || "0")
        : -BigInt(account.opening_balance_minor || "0")),
    0n,
  );
  const year = new Date().getFullYear();
  const dateRange = `01-Jan-${year} to 31-Dec-${year}`;

  return (
    <div className="flex flex-col">
      <section className="flex h-[70px] shrink-0 items-center rounded-[var(--card-radius)] border border-card-border bg-card px-[var(--space-16)]">
        <h1 className="min-w-0 truncate fs-title font-semibold text-heading">
          Chart of accounts
        </h1>
        <div className="ml-auto flex shrink-0 items-center gap-[9px]">
          <button
            type="button"
            onClick={() => pushToast("Adding groups arrives with the Accounting phase.")}
            className="flex h-8 items-center gap-[8px] rounded-[var(--control-radius)] px-[var(--space-6)] fs-text font-medium text-brand outline-none transition-colors hover:bg-primary-tint focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add groups
          </button>
          <button
            type="button"
            onClick={() => pushToast("Adding ledgers arrives with the Accounting phase.")}
            className="flex h-8 items-center gap-[8px] rounded-[var(--control-radius)] px-[var(--space-6)] fs-text font-medium text-brand outline-none transition-colors hover:bg-primary-tint focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add ledgers
          </button>
          <div className="flex w-[268px] items-center justify-between gap-[var(--space-8)] px-[var(--space-6)] fs-text text-brand">
            <span className="truncate">{dateRange}</span>
            <Calendar className="size-4 shrink-0" aria-hidden="true" />
          </div>
        </div>
      </section>

      {forbidden ? (
        <ForbiddenPanel
          className="mt-[var(--space-8)]"
          message="Your role cannot view the chart of accounts. Ask an administrator for Settings Accounting : View."
        />
      ) : loading ? (
        <PanelSkeleton className="mt-[var(--space-8)]" rows={8} />
      ) : error ? (
        <ErrorPanel
          className="mt-[var(--space-8)]"
          message={error}
          onRetry={() => setRefresh((value) => value + 1)}
        />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No ledger account yet"
          description="Seed the institution's chart of accounts before posting any entry."
        />
      ) : (
        <>
          {openingDifference !== 0n ? (
            <div className="flex h-[56px] items-center rounded-[var(--card-radius)] bg-accent-red-bg px-[var(--space-12)] fs-text text-accent-red">
              There is a difference in opening balance of{" "}
              {formatBalance(
                (openingDifference > 0n ? -openingDifference : openingDifference).toString(),
                "debit",
              )}
            </div>
          ) : null}
          <section className="mt-[var(--space-8)] overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card pb-[var(--space-12)]">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-auto pl-[var(--space-12)]">Account name</TableHead>
                  <TableHead className="h-auto w-[200px]">Type</TableHead>
                  <TableHead className="h-auto w-[150px] text-right">O/P balance (TSh)</TableHead>
                  <TableHead className="h-auto w-[279px] text-right">C/L balance (TSh)</TableHead>
                  <TableHead className="h-auto w-[81px] pr-[var(--space-16)] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((account) => {
                  const isExpandedRow = isExpanded(account.id);
                  return (
                    <TableRow key={account.id} className="h-[45px]">
                      <TableCell className="pl-[var(--space-12)]">
                        <div className="flex items-center">
                          {account.is_group ? (
                            <button
                              type="button"
                              onClick={() => toggle(account.id)}
                              className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground hover:text-strong"
                              aria-label={isExpandedRow ? "Collapse group" : "Expand group"}
                            >
                              {isExpandedRow ? (
                                <ChevronDown className="size-3" />
                              ) : (
                                <ChevronRight className="size-3" />
                              )}
                            </button>
                          ) : (
                            <span className="size-5 shrink-0" />
                          )}
                          <Link
                            href={
                              account.is_group
                                ? `/accounting-ledger-entries?group=${account.code}`
                                : `/accounting-ledger-entries?account=${account.code}`
                            }
                            className="ml-[var(--space-16)] truncate text-body hover:underline"
                          >
                            {sentenceCase(account.name)}
                          </Link>
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
                      <TableCell className="text-body">
                        {account.is_group ? "Group" : "Ledger"}
                      </TableCell>
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
          </section>
        </>
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
                  <option key={g.id} value={g.id}>{g.code} {sentenceCase(g.name)}</option>
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
