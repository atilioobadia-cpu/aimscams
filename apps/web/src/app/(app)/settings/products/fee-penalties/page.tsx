"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, Pencil, Building2, UserCheck, UserX } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton, FormError, SuccessNote } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu, type RowAction } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader breadcrumb="Settings" title="Fees and penalties" description="Fee and penalty definitions used by products and transactions." />
        {data?.canEdit ? (
          <Button onClick={openCreate} className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
            <Plus className="size-4" aria-hidden="true" />
            Create fee or penalty
          </Button>
        ) : null}
      </div>

      <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="fee-search">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="fee-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Code or name"
                className="h-[var(--control-height)] pl-9"
              />
            </div>
          </div>
          <div className="w-full md:w-[180px]">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="fee-kind">
              Kind
            </label>
            <select
              id="fee-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
            >
              <option value="">All kinds</option>
              <option value="FEE">Fee</option>
              <option value="PENALTY">Penalty</option>
            </select>
          </div>
          <div className="w-full md:w-[180px]">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="fee-status">
              Status
            </label>
            <select
              id="fee-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view fees and penalties. Ask an administrator for Settings Product : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? "No fee or penalty matches" : "No fees or penalties yet"}
          description={hasFilters ? "Adjust or clear the filters to see other items." : "Create a fee or penalty definition."}
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Kind</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">GL account</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
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
                    <tr key={item.id} className="border-b border-card-border last:border-0">
                      <td className="px-4 py-3 font-medium text-strong">{item.code}</td>
                      <td className="px-4 py-3 text-body">{item.name}</td>
                      <td className="px-4 py-3 text-body">{item.kind}</td>
                      <td className="px-4 py-3 tabular-nums text-body">
                        {item.amountType === "FIXED"
                          ? item.amountMinor ?? "N/A"
                          : `${((item.rateBp ?? 0) / 100).toFixed(2)}%`}
                      </td>
                      <td className="px-4 py-3 text-body">{item.glAccountId ?? "N/A"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{titleCase(item.status)}</Badge>
                      </td>
                      <td className="px-4 py-3">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit fee or penalty" : "Create fee or penalty"} size="large">
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
                Name
              </label>
              <Input id="fee-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="fee-kind">
                Kind
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
                GL account
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
