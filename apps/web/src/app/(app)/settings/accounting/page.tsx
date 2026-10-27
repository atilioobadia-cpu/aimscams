"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck,
  CalendarRange,
  CalendarX,
  Pencil,
  Plus,
  Scale,
  SlidersHorizontal,
} from "lucide-react";

import { AccountingNav } from "@/components/accounting/accounting-nav";
import {
  ErrorPanel,
  ForbiddenPanel,
  FormError,
  PanelSkeleton,
  SuccessNote,
} from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu, type RowAction } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import {
  createFiscalPeriod,
  getAccountingSettings,
  updateAccountingSettings,
  updateFiscalPeriod,
  updatePostingPolicy,
  type AccountingSettings,
  type FiscalPeriod,
  type GlAccount,
  type PolicyAmount,
  type PolicyLine,
  type PostingPolicy,
} from "@/lib/accounting";
import { cn } from "cn";

const AMOUNT_LABELS: Record<PolicyAmount, string> = {
  total: "Total",
  principal: "Principal",
  interest: "Interest",
  penalty: "Penalty",
  charges: "Charges",
};

const AMOUNT_KEYS = Object.keys(AMOUNT_LABELS) as PolicyAmount[];

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function message(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function displayDay(value: string): string {
  return dateFormat.format(new Date(`${value}T00:00:00`));
}

function taxPercentFromBp(bp: number): string {
  return String(bp / 100);
}

function mappingText(policy: PostingPolicy): string {
  return policy.lines
    .map(
      (line) =>
        `${line.side === "debit" ? "Dr" : "Cr"} ${line.account} ${AMOUNT_LABELS[line.amount]}`,
    )
    .join(" · ");
}

function nextYearPeriod() {
  const year = new Date().getFullYear() + 1;
  return { startsOn: `${year}-01-01`, endsOn: `${year}-12-31` };
}

export default function AccountingSettingsPage() {
  const { pushToast } = useToast();
  const [data, setData] = useState<AccountingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [taxRate, setTaxRate] = useState("0");
  const [interBranch, setInterBranch] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSaved, setSettingsSaved] = useState<string | null>(null);

  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodForm, setPeriodForm] = useState(nextYearPeriod);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [periodSaving, setPeriodSaving] = useState(false);

  const [statusTarget, setStatusTarget] = useState<FiscalPeriod | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const [policyTarget, setPolicyTarget] = useState<PostingPolicy | null>(null);
  const [policyLines, setPolicyLines] = useState<PolicyLine[]>([]);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policySaving, setPolicySaving] = useState(false);

  const load = useCallback(async (resetForm: boolean) => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const response = await getAccountingSettings();
      setData(response);
      if (resetForm) {
        setTaxRate(taxPercentFromBp(response.settings.taxRateBp));
        setInterBranch(response.settings.interBranchEnabled);
      }
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 403) {
        setForbidden(true);
      } else {
        setError(message(failure, "Could not load the accounting settings."));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  const postableAccounts = (data?.accounts ?? []).filter((account) => account.isPostable);

  async function saveSettings() {
    setSettingsError(null);
    setSettingsSaved(null);

    const trimmed = taxRate.trim().replace(/,/g, "");
    if (!/^\d{1,3}(\.\d{1,2})?$/.test(trimmed)) {
      setSettingsError("Tax rate must be between 0 and 100 with at most two decimals.");
      return;
    }
    const percent = Number(trimmed);
    if (percent < 0 || percent > 100) {
      setSettingsError("Tax rate must be between 0 and 100 with at most two decimals.");
      return;
    }

    setSavingSettings(true);
    try {
      await updateAccountingSettings({
        taxRateBp: Math.round(percent * 100),
        interBranchEnabled: interBranch,
      });
      setSettingsSaved("Statutory settings saved.");
      pushToast("Statutory settings saved.");
      await load(false);
    } catch (failure) {
      setSettingsError(message(failure, "Could not save the statutory settings."));
    } finally {
      setSavingSettings(false);
    }
  }

  async function submitPeriod() {
    setPeriodError(null);
    if (!periodForm.startsOn || !periodForm.endsOn) {
      setPeriodError("Both the start and end date are required.");
      return;
    }
    if (periodForm.endsOn < periodForm.startsOn) {
      setPeriodError("The period must end on or after it starts.");
      return;
    }
    setPeriodSaving(true);
    try {
      await createFiscalPeriod({
        startsOn: periodForm.startsOn,
        endsOn: periodForm.endsOn,
      });
      setPeriodOpen(false);
      setPeriodForm(nextYearPeriod());
      pushToast("Fiscal period created.");
      await load(false);
    } catch (failure) {
      setPeriodError(message(failure, "Could not create the fiscal period."));
    } finally {
      setPeriodSaving(false);
    }
  }

  async function changeStatus() {
    if (!statusTarget) return;
    const target = statusTarget.status === "open" ? "closed" : "open";
    setStatusError(null);
    setStatusSaving(true);
    try {
      await updateFiscalPeriod(statusTarget.id, { status: target });
      setStatusTarget(null);
      pushToast(`Period ${target === "open" ? "reopened" : "closed"}.`);
      await load(false);
    } catch (failure) {
      setStatusError(message(failure, "Could not change the period status."));
    } finally {
      setStatusSaving(false);
    }
  }

  function openPolicy(policy: PostingPolicy) {
    setPolicyTarget(policy);
    setPolicyLines(policy.lines.map((line) => ({ ...line })));
    setPolicyError(null);
  }

  function updateLine(index: number, patch: Partial<PolicyLine>) {
    setPolicyLines((current) =>
      current.map((line, position) => (position === index ? { ...line, ...patch } : line)),
    );
  }

  async function savePolicy() {
    if (!policyTarget) return;
    setPolicyError(null);
    if (policyLines.length < 2) {
      setPolicyError("A posting policy needs at least two lines.");
      return;
    }
    if (!policyLines.some((line) => line.side === "debit")) {
      setPolicyError("Add at least one debit line.");
      return;
    }
    if (!policyLines.some((line) => line.side === "credit")) {
      setPolicyError("Add at least one credit line.");
      return;
    }
    if (policyLines.some((line) => !line.account)) {
      setPolicyError("Every policy line needs a ledger account.");
      return;
    }

    setPolicySaving(true);
    try {
      await updatePostingPolicy(policyTarget.eventCode, { lines: policyLines });
      setPolicyTarget(null);
      pushToast("Posting policy saved.");
      await load(false);
    } catch (failure) {
      setPolicyError(message(failure, "Could not save the posting policy."));
    } finally {
      setPolicySaving(false);
    }
  }

  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader
        title="Accounting settings"
        description="The statutory rate, the fiscal calendar and how each business event reaches the general ledger."
        breadcrumb="Settings"
      />

      <AccountingNav />

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view accounting settings. Ask an administrator for Settings Accounting : View." />
      ) : loading ? (
        <PanelSkeleton rows={9} />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => void load(true)} />
      ) : data ? (
        <>
          <section className="rounded-[var(--card-radius)] border border-card-border bg-card">
            <header className="flex flex-wrap items-start justify-between gap-[var(--space-10)] border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
              <div>
                <h2 className="flex items-center gap-2 text-fs font-bold text-strong">
                  <SlidersHorizontal className="size-4 text-brand" aria-hidden="true" />
                  Statutory settings
                </h2>
                <p className="mt-1 text-fs text-muted-foreground">
                  Applies to every branch of {data.organisation?.name ?? "this institution"}.
                </p>
              </div>
              <span className="text-fs text-muted-foreground">
                {data.settings.updatedAt
                  ? `Updated ${displayDay(data.settings.updatedAt.slice(0, 10))}`
                  : "Never updated"}
              </span>
            </header>

            <div className="grid gap-[var(--space-18)] px-[var(--space-16)] py-[var(--space-14)] lg:grid-cols-2">
              <div>
                <label htmlFor="tax-rate" className="mb-1 block text-fs font-medium text-strong">
                  Tax rate (%)
                </label>
                <Input
                  id="tax-rate"
                  value={taxRate}
                  inputMode="decimal"
                  className="max-w-[180px]"
                  onChange={(event) => {
                    setTaxRate(event.target.value);
                    setSettingsSaved(null);
                  }}
                />
                <p className="mt-1 text-fs text-muted-foreground">
                  Whole or two-decimal percentage applied to taxable charges. Set 0 to disable.
                </p>
              </div>

              <div>
                <span className="mb-1 block text-fs font-medium text-strong">
                  Inter-branch ledger
                </span>
                <div className="flex items-center gap-[var(--space-10)]">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={interBranch}
                    aria-label="Inter-branch ledger"
                    onClick={() => {
                      setInterBranch((value) => !value);
                      setSettingsSaved(null);
                    }}
                    className={cn(
                      "relative h-5 w-9 shrink-0 rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                      interBranch ? "border-brand bg-brand" : "border-border bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-[14px] rounded-full bg-surface shadow-sm transition-all",
                        interBranch ? "left-[18px]" : "left-0.5",
                      )}
                    />
                  </button>
                  <span className="text-fs text-muted-foreground">
                    {interBranch ? "On — branch transfers post both sides." : "Off — branch transfers do not post."}
                  </span>
                </div>
                <p className="mt-1 text-fs text-muted-foreground">
                  Keep this on only when each branch keeps its own due-to and due-from ledger.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-[var(--space-10)] border-t border-chrome px-[var(--space-16)] py-[var(--space-12)]">
              <Button onClick={() => void saveSettings()} disabled={savingSettings}>
                {savingSettings ? "Saving…" : "Save settings"}
              </Button>
              <FormError message={settingsError} />
              <SuccessNote message={settingsSaved} />
            </div>
          </section>

          <section className="rounded-[var(--card-radius)] border border-card-border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-[var(--space-10)] border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
              <div>
                <h2 className="flex items-center gap-2 text-fs font-bold text-strong">
                  <CalendarRange className="size-4 text-brand" aria-hidden="true" />
                  Fiscal periods
                </h2>
                <p className="mt-1 text-fs text-muted-foreground">
                  Entries post only into an open period. Closing blocks on unposted drafts.
                </p>
              </div>
              <Button size="sm" onClick={() => setPeriodOpen(true)} className="gap-1.5">
                <Plus className="size-4" aria-hidden="true" />
                New period
              </Button>
            </header>

            {data.periods.length === 0 ? (
              <div className="p-[var(--space-16)]">
                <EmptyState
                  icon={CalendarRange}
                  title="No fiscal period yet"
                  description="Create the first period before posting any journal entry."
                  action={
                    <Button size="sm" onClick={() => setPeriodOpen(true)}>
                      New period
                    </Button>
                  }
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-[var(--space-16)]">Period</TableHead>
                    <TableHead>Starts</TableHead>
                    <TableHead>Ends</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-[var(--space-16)] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.periods.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell className="pl-[var(--space-16)] font-medium text-strong">
                        {period.startsOn.slice(0, 4)}
                      </TableCell>
                      <TableCell>{displayDay(period.startsOn)}</TableCell>
                      <TableCell>{displayDay(period.endsOn)}</TableCell>
                      <TableCell>
                        <Badge variant={period.status === "open" ? "default" : "outline"}>
                          {period.status === "open" ? "Open" : "Closed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-[var(--space-16)] text-right">
                        <RowActionsMenu
                          label={`fiscal period ${period.startsOn.slice(0, 4)}`}
                          actions={
                            [
                              {
                                label:
                                  period.status === "open" ? "Close period" : "Reopen period",
                                icon: period.status === "open" ? CalendarX : CalendarCheck,
                                onSelect: () => {
                                  setStatusTarget(period);
                                  setStatusError(null);
                                },
                              },
                            ] satisfies RowAction[]
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          <section className="rounded-[var(--card-radius)] border border-card-border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-[var(--space-10)] border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
              <div>
                <h2 className="flex items-center gap-2 text-fs font-bold text-strong">
                  <Scale className="size-4 text-brand" aria-hidden="true" />
                  Posting policies
                </h2>
                <p className="mt-1 text-fs text-muted-foreground">
                  Every edit adds a new version. Posted entries keep the version they used.
                </p>
              </div>
              <span className="text-fs text-muted-foreground">
                {data.policies.length} event{data.policies.length === 1 ? "" : "s"}
              </span>
            </header>

            {data.policies.length === 0 ? (
              <div className="p-[var(--space-16)]">
                <EmptyState
                  icon={Scale}
                  title="No posting policy"
                  description="Policies arrive with the account chart seed. Re-provision this institution to restore them."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-[var(--space-16)]">Event</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Ledger mapping</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="pr-[var(--space-16)] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="pl-[var(--space-16)] font-medium text-strong">
                        {policy.eventCode}
                      </TableCell>
                      <TableCell>v{policy.version}</TableCell>
                      <TableCell className="max-w-[420px] whitespace-normal leading-[1.45]">
                        {mappingText(policy)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={policy.isAssumption ? "outline" : "secondary"}>
                          {policy.isAssumption ? "Assumption" : "Standard"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-[var(--space-16)] text-right">
                        <RowActionsMenu
                          label={`posting policy ${policy.eventCode}`}
                          actions={
                            [
                              {
                                label: "Edit posting policy",
                                icon: Pencil,
                                onSelect: () => openPolicy(policy),
                              },
                            ] satisfies RowAction[]
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </>
      ) : null}

      <Modal
        open={periodOpen}
        onClose={() => setPeriodOpen(false)}
        title="New fiscal period"
        footer={
          <>
            <Button variant="outline" onClick={() => setPeriodOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void submitPeriod()} disabled={periodSaving}>
              {periodSaving ? "Creating…" : "Create period"}
            </Button>
          </>
        }
      >
        <div className="space-y-[var(--space-14)]">
          <div className="grid gap-[var(--space-14)] sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-fs font-medium text-strong">Starts on</span>
              <Input
                type="date"
                value={periodForm.startsOn}
                onChange={(event) =>
                  setPeriodForm((form) => ({ ...form, startsOn: event.target.value }))
                }
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-fs font-medium text-strong">Ends on</span>
              <Input
                type="date"
                value={periodForm.endsOn}
                onChange={(event) =>
                  setPeriodForm((form) => ({ ...form, endsOn: event.target.value }))
                }
              />
            </label>
          </div>
          <p className="text-fs text-muted-foreground">
            Periods cannot overlap. A closing blocks any draft entry inside the range.
          </p>
          <FormError message={periodError} />
        </div>
      </Modal>

      <Modal
        open={statusTarget !== null}
        onClose={() => setStatusTarget(null)}
        title={statusTarget?.status === "open" ? "Close fiscal period" : "Reopen fiscal period"}
        footer={
          <>
            <Button variant="outline" onClick={() => setStatusTarget(null)}>
              Cancel
            </Button>
            <Button onClick={() => void changeStatus()} disabled={statusSaving}>
              {statusSaving
                ? "Saving…"
                : statusTarget?.status === "open"
                  ? "Close period"
                  : "Reopen period"}
            </Button>
          </>
        }
      >
        {statusTarget ? (
          <div className="space-y-[var(--space-14)]">
            <p className="text-fs text-strong">
              {displayDay(statusTarget.startsOn)} — {displayDay(statusTarget.endsOn)}
            </p>
            <p className="text-fs text-muted-foreground">
              {statusTarget.status === "open"
                ? "Closing stops new postings into this period. Any draft entry in the range must be posted or removed first."
                : "Reopening lets the period accept postings again. Closed books can still be audited."}
            </p>
            <FormError message={statusError} />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={policyTarget !== null}
        onClose={() => setPolicyTarget(null)}
        title={policyTarget ? `Posting policy · ${policyTarget.eventCode}` : "Posting policy"}
        size="large"
        footer={
          <>
            <Button variant="outline" onClick={() => setPolicyTarget(null)}>
              Cancel
            </Button>
            <Button onClick={() => void savePolicy()} disabled={policySaving}>
              {policySaving ? "Saving…" : "Save new version"}
            </Button>
          </>
        }
      >
        {policyTarget ? (
          <div className="space-y-[var(--space-14)]">
            <div className="flex flex-wrap items-center gap-2 text-fs text-muted-foreground">
              <span>
                Current version v{policyTarget.version} · saving creates v{policyTarget.version + 1}
              </span>
              {policyTarget.isAssumption ? (
                <Badge variant="outline">Assumption</Badge>
              ) : (
                <Badge variant="secondary">Standard</Badge>
              )}
            </div>

            {policyTarget.note ? (
              <p className="rounded-[6px] bg-muted/60 px-[var(--space-10)] py-[var(--space-8)] text-fs leading-[1.45] text-muted-foreground">
                {policyTarget.note}
              </p>
            ) : null}

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_110px_130px_32px] gap-2 text-fs font-medium text-muted-foreground">
                <span>Ledger account</span>
                <span>Side</span>
                <span>Amount key</span>
                <span className="sr-only">Remove</span>
              </div>
              {policyLines.map((line, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_110px_130px_32px] items-center gap-2"
                >
                  <select
                    aria-label={`Line ${index + 1} account`}
                    value={line.account}
                    onChange={(event) => updateLine(index, { account: event.target.value })}
                    className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-transparent px-[var(--space-8)] text-fs text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {postableAccounts.map((account: GlAccount) => (
                      <option key={account.code} value={account.code}>
                        {account.code} · {account.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={`Line ${index + 1} side`}
                    value={line.side}
                    onChange={(event) =>
                      updateLine(index, { side: event.target.value as PolicyLine["side"] })
                    }
                    className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-transparent px-[var(--space-8)] text-fs text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                  <select
                    aria-label={`Line ${index + 1} amount`}
                    value={line.amount}
                    onChange={(event) =>
                      updateLine(index, { amount: event.target.value as PolicyAmount })
                    }
                    className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-transparent px-[var(--space-8)] text-fs text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {AMOUNT_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {AMOUNT_LABELS[key]}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove line ${index + 1}`}
                    disabled={policyLines.length <= 2}
                    onClick={() =>
                      setPolicyLines((current) =>
                        current.filter((_, position) => position !== index),
                      )
                    }
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                setPolicyLines((current) => [
                  ...current,
                  {
                    account: postableAccounts[0]?.code ?? "",
                    side: "debit",
                    amount: "total",
                  },
                ])
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              Add line
            </Button>

            <FormError message={policyError} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
