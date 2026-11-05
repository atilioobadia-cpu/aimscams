"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Search, Pencil, SlidersHorizontal, UserCheck, UserX } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton, FormError, SuccessNote } from "@/components/accounting/states";
import { RowActionsMenu, type RowAction } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ProductSetupHeader } from "@/components/settings/product-setup-header";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { parseMajorToMinor } from "@/lib/accounting";
import {
  createFeePenalty,
  listFeePenalties,
  updateFeePenalty,
  type FeeAmountType,
  type FeePenalty,
  type FeePenaltyKind,
  type FeePenaltyStatus,
} from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function FeePenaltiesPage() {
  const { pushToast } = useToast();
  const [data, setData] = useState<Awaited<ReturnType<typeof listFeePenalties>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [showKindFilter, setShowKindFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showChargeType, setShowChargeType] = useState(true);
  const [showLedgerCode, setShowLedgerCode] = useState(true);
  const [showTaxRates, setShowTaxRates] = useState(true);
  const [showTaxInclusive, setShowTaxInclusive] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FeePenalty | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [itemKind, setItemKind] = useState<FeePenaltyKind>("FEE");
  const [amountType, setAmountType] = useState<FeeAmountType>("FIXED");
  const [amount, setAmount] = useState("0");
  const [rate, setRate] = useState("0");
  const [glAccount, setGlAccount] = useState("");
  const [itemStatus, setItemStatus] = useState<FeePenaltyStatus>("ACTIVE");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);

        void listFeePenalties({ q: query, status, kind })
          .then((next) => {
            if (cancelled) return;
            setData(next);
            setForbidden(false);
          })
          .catch((failure: unknown) => {
            if (cancelled) return;
            if (failure instanceof ApiError && failure.status === 403) {
              setForbidden(true);
              setData(null);
            } else {
              setError(message(failure, "Could not load fees and penalties."));
            }
          })
          .finally(() => {
            if (cancelled) return;
            firstLoad.current = false;
            setLoading(false);
          });
      },
      firstLoad.current ? 0 : 250,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, status, kind, reloadKey]);

  function openCreate() {
    setEditing(null);
    setCode("");
    setName("");
    setItemKind("FEE");
    setAmountType("FIXED");
    setAmount("0");
    setRate("0");
    setGlAccount("");
    setItemStatus("ACTIVE");
    setDescription("");
    setSaveError(null);
    setSaved(null);
    setModalOpen(true);
  }

  function openEdit(item: FeePenalty) {
    setEditing(item);
    setCode(item.code);
    setName(item.name);
    setItemKind(item.kind);
    setAmountType(item.amountType);
    setAmount(item.amountMinor ? (Number(item.amountMinor) / 100).toFixed(2) : "0");
    setRate(item.rateBp !== null ? (item.rateBp / 100).toFixed(2) : "0");
    setGlAccount(item.glAccountId ?? "");
    setItemStatus(item.status);
    setDescription(item.description ?? "");
    setSaveError(null);
    setSaved(null);
    setModalOpen(true);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaved(null);

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    if (!trimmedCode) {
      setSaveError("Code is required.");
      return;
    }
    if (!trimmedName) {
      setSaveError("Name is required.");
      return;
    }

    const payload: Record<string, unknown> = {
      code: trimmedCode,
      name: trimmedName,
      kind: itemKind,
      amountType,
      glAccountId: glAccount.trim() || null,
      status: itemStatus,
      description: description.trim() || null,
    };
    if (amountType === "FIXED") {
      const minor = parseMajorToMinor(amount);
      if (minor === null) {
        setSaveError("Amount must be a valid amount.");
        return;
      }
      payload.amountMinor = minor.toString();
      payload.rateBp = null;
    } else {
      const rateBp = Number(rate);
      if (!Number.isFinite(rateBp) || rateBp < 0) {
        setSaveError("Rate must be a valid number.");
        return;
      }
      payload.amountMinor = null;
      payload.rateBp = Math.round(rateBp * 100);
    }

    setSaving(true);
    try {
      if (editing) {
        await updateFeePenalty(editing.id, payload);
        pushToast("Fee or penalty updated.");
      } else {
        await createFeePenalty(payload as never);
        pushToast("Fee or penalty created.");
      }
      setSaved(editing ? "Saved." : "Created.");
      setModalOpen(false);
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setSaveError(message(failure, "Could not save this fee or penalty."));
    } finally {
      setSaving(false);
    }
  }

  const items = data?.items ?? [];
  const hasFilters = Boolean(query.trim() || status || kind);
  const columnCount = 2 + Number(showChargeType) + Number(showLedgerCode) + Number(showTaxRates) + Number(showTaxInclusive);

  return (
    <div className="space-y-3">
      <ProductSetupHeader active="fee-penalties" />
      {data?.canEdit ? <div className="flex justify-end px-[13.44px] py-[6.72px]"><Button type="button" variant="outline" onClick={openCreate} className="h-[42px] border-primary px-4 text-primary hover:bg-primary-tint hover:text-primary"><Plus className="size-4" aria-hidden="true" />Add Charge</Button></div> : null}

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view fees and penalties. Ask an administrator for Settings Product : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <div className="flex min-h-[56px] flex-wrap items-center gap-4 border-b border-chrome px-[13.44px] py-[6.72px]">
              <label className="relative block w-[240px] max-w-full"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" /><Input id="fee-search" aria-label="Search charges" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-[42px] border-primary pl-10 text-primary placeholder:text-primary" /></label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button type="button" variant="outline" className="h-[42px] min-w-[168px] justify-between border-primary px-3 text-primary hover:bg-primary-tint hover:text-primary"><span className="flex items-center gap-2"><Plus className="size-4" aria-hidden="true" />Add Filters</span><ChevronDown className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="start"><DropdownMenuCheckboxItem checked={showKindFilter} onCheckedChange={setShowKindFilter}>Charge Type</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem checked={showStatusFilter} onCheckedChange={setShowStatusFilter}>Status</DropdownMenuCheckboxItem></DropdownMenuContent>
              </DropdownMenu>
              {hasFilters ? <Button type="button" variant="ghost" onClick={() => { setQuery(""); setKind(""); setStatus(""); }} className="text-muted-foreground">Clear</Button> : null}
            </div>
            {showKindFilter || showStatusFilter ? <div className="flex flex-wrap gap-3 border-b border-chrome px-[var(--space-12)] py-3">{showKindFilter ? <select id="fee-kind" aria-label="Filter by charge type" value={kind} onChange={(event) => setKind(event.target.value)} className="h-[42px] min-w-[180px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body"><option value="">All charge types</option><option value="FEE">Fee</option><option value="PENALTY">Penalty</option></select> : null}{showStatusFilter ? <select id="fee-status" aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-[42px] min-w-[180px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select> : null}</div> : null}
            <table className="w-full min-w-[1000px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold text-label">
                <tr>
                  <th className="px-4 py-3">Account Number</th>
                  <th className="px-4 py-3">Charge Name</th>
                  {showChargeType ? <th className="px-4 py-3">Charge Type</th> : null}
                  {showLedgerCode ? <th className="px-4 py-3">General Ledger Code</th> : null}
                  {showTaxRates ? <th className="px-4 py-3">Tax Rates</th> : null}
                  {showTaxInclusive ? <th className="px-4 py-3">Tax Inclusive</th> : null}
                  <th className="w-14 px-2 py-2 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label="Table columns" className="text-primary"><SlidersHorizontal className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuCheckboxItem checked={showChargeType} onCheckedChange={setShowChargeType}>Charge Type</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem checked={showLedgerCode} onCheckedChange={setShowLedgerCode}>General Ledger Code</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem checked={showTaxRates} onCheckedChange={setShowTaxRates}>Tax Rates</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem checked={showTaxInclusive} onCheckedChange={setShowTaxInclusive}>Tax Inclusive</DropdownMenuCheckboxItem></DropdownMenuContent></DropdownMenu></th>
                </tr>
              </thead>
              <tbody className="text-body">
                {items.length === 0 ? <tr><td colSpan={columnCount} className="h-[216px] px-4 text-center text-muted-foreground"><div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-subtle text-muted-foreground"><Search className="size-6" aria-hidden="true" /></div>{hasFilters ? "No charges match these filters." : "No data available"}</td></tr> : null}
                {items.map((item) => {
                  const actions: RowAction[] = data?.canEdit
                    ? [
                        { label: "Edit", icon: Pencil, onSelect: () => openEdit(item) },
                        {
                          label: item.status === "ACTIVE" ? "Deactivate" : "Activate",
                          icon: item.status === "ACTIVE" ? UserX : UserCheck,
                          onSelect: async () => {
                            const next = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                            await updateFeePenalty(item.id, { status: next });
                            pushToast(`Fee or penalty ${next === "ACTIVE" ? "activated" : "deactivated"}.`);
                            setReloadKey((value) => value + 1);
                          },
                        },
                      ]
                    : [];
                  return (
                    <tr key={item.id} className="h-[52.27px] border-b border-card-border bg-white last:border-0">
                      <td className="px-4 py-3">N/A</td>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      {showChargeType ? <td className="px-4 py-3">{titleCase(item.kind)}</td> : null}
                      {showLedgerCode ? <td className="px-4 py-3">{item.glAccountId ?? "N/A"}</td> : null}
                      {showTaxRates ? <td className="px-4 py-3">N/A</td> : null}
                      {showTaxInclusive ? <td className="px-4 py-3">N/A</td> : null}
                      <td className="w-14 bg-subtle/40 px-2 py-3">
                        <div className="flex justify-end">
                          <RowActionsMenu label={`${item.code} ${item.name}`} actions={actions} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Details" size="large">
        <form className="space-y-5" onSubmit={(event) => void save(event)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="fee-code">
                Code
              </label>
              <Input id="fee-code" value={code} onChange={(event) => setCode(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="fee-name">
                Charge Name <span className="text-accent-red" aria-hidden="true">*</span>
              </label>
              <Input id="fee-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="fee-kind">
                Charge Type <span className="text-accent-red" aria-hidden="true">*</span>
              </label>
              <select
                id="fee-kind"
                value={itemKind}
                onChange={(event) => setItemKind(event.target.value as FeePenaltyKind)}
                className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
              >
                <option value="FEE">Fee</option>
                <option value="PENALTY">Penalty</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="fee-amount-type">
                Amount type
              </label>
              <select
                id="fee-amount-type"
                value={amountType}
                onChange={(event) => setAmountType(event.target.value as FeeAmountType)}
                className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
              >
                <option value="FIXED">Fixed</option>
                <option value="PERCENTAGE">Percentage</option>
              </select>
            </div>
            {amountType === "FIXED" ? (
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="fee-amount">
                  Amount
                </label>
                <Input id="fee-amount" value={amount} onChange={(event) => setAmount(event.target.value)} className="h-[var(--control-height)]" />
              </div>
            ) : (
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="fee-rate">
                  Rate (%)
                </label>
                <Input id="fee-rate" value={rate} onChange={(event) => setRate(event.target.value)} className="h-[var(--control-height)]" />
              </div>
            )}
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="fee-gl">
                General Ledger Code
              </label>
              <Input id="fee-gl" value={glAccount} onChange={(event) => setGlAccount(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="fee-status">
                Status
              </label>
              <select
                id="fee-status"
                value={itemStatus}
                onChange={(event) => setItemStatus(event.target.value as FeePenaltyStatus)}
                className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="fee-description">
              Description
            </label>
            <textarea
              id="fee-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] py-[var(--space-8)] fs-text"
            />
          </div>

          <FormError message={saveError} />
          <SuccessNote message={saved} />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
              {saving ? "Saving..." : editing ? "Save changes" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
