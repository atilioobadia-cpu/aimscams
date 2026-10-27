"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, Building2, UserCheck, UserX } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton, FormError, SuccessNote } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import {
  createProvisioningRule,
  listProvisioningRules,
  updateProvisioningRule,
  type ProvisioningRule,
  type ProvisioningRuleStatus,
} from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function ProvisioningRulesPage() {
  const { pushToast } = useToast();
  const [data, setData] = useState<Awaited<ReturnType<typeof listProvisioningRules>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [itemStatus, setItemStatus] = useState<ProvisioningRuleStatus>("ACTIVE");
  const [daysFrom, setDaysFrom] = useState("0");
  const [daysTo, setDaysTo] = useState("");
  const [rate, setRate] = useState("0");
  const [glAccount, setGlAccount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);

        void listProvisioningRules({ q: query, status })
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
              setError(message(failure, "Could not load provisioning rules."));
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
  }, [query, status, reloadKey]);

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
    const from = Number(daysFrom);
    const to = daysTo.trim() === "" ? null : Number(daysTo);
    const rateBp = Number(rate);
    if (!Number.isFinite(from) || from < 0) {
      setSaveError("Days from must be a valid number.");
      return;
    }
    if (to !== null && (!Number.isFinite(to) || to < from)) {
      setSaveError("Days to must be greater than or equal to days from.");
      return;
    }
    if (!Number.isFinite(rateBp) || rateBp < 0) {
      setSaveError("Rate must be a valid number.");
      return;
    }

    setSaving(true);
    try {
      await createProvisioningRule({
        code: trimmedCode,
        name: trimmedName,
        status: itemStatus,
        daysFrom: from,
        daysTo: to,
        rateBp: Math.round(rateBp * 100),
        glAccountId: glAccount.trim() || null,
        description: description.trim() || null,
      });
      pushToast("Provisioning rule created.");
      setSaved("Created.");
      setModalOpen(false);
      setCode("");
      setName("");
      setDaysFrom("0");
      setDaysTo("");
      setRate("0");
      setGlAccount("");
      setDescription("");
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setSaveError(message(failure, "Could not create this provisioning rule."));
    } finally {
      setSaving(false);
    }
  }

  const items = data?.items ?? [];
  const hasFilters = Boolean(query.trim() || status);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Loan provisioning rules" description="Provisioning rules applied to loan assets." />
        {data?.canEdit ? (
          <Button onClick={() => setModalOpen(true)} className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
            <Plus className="size-4" aria-hidden="true" />
            Create provisioning rule
          </Button>
        ) : null}
      </div>

      <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="provisioning-search">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="provisioning-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Code or name"
                className="h-[var(--control-height)] pl-9"
              />
            </div>
          </div>
          <div className="w-full md:w-[220px]">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="provisioning-status">
              Status
            </label>
            <select
              id="provisioning-status"
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
        <ForbiddenPanel message="Your role cannot view provisioning rules. Ask an administrator for Settings Product : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? "No provisioning rule matches" : "No provisioning rules yet"}
          description={hasFilters ? "Adjust or clear the filters to see other rules." : "Create a provisioning rule."}
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Days from</th>
                  <th className="px-4 py-3">Days to</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">GL account</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="px-4 py-3 font-medium text-strong">{item.code}</td>
                    <td className="px-4 py-3 text-body">{item.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-body">{item.daysFrom}</td>
                    <td className="px-4 py-3 tabular-nums text-body">{item.daysTo ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-body">{(item.rateBp / 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-body">{item.glAccountId ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <RowActionsMenu
                          label={`${item.code} ${item.name}`}
                          actions={
                            data?.canEdit
                              ? [
                                  {
                                    label: item.status === "ACTIVE" ? "Deactivate" : "Activate",
                                    icon: item.status === "ACTIVE" ? UserX : UserCheck,
                                    onSelect: async () => {
                                      const next = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                                      await updateProvisioningRule(item.id, { status: next });
                                      pushToast(`Provisioning rule ${next === "ACTIVE" ? "activated" : "deactivated"}.`);
                                      setReloadKey((value) => value + 1);
                                    },
                                  },
                                ]
                              : []
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create provisioning rule" size="large">
        <form className="space-y-5" onSubmit={(event) => void save(event)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="pr-code">
                Code
              </label>
              <Input id="pr-code" value={code} onChange={(event) => setCode(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="pr-name">
                Name
              </label>
              <Input id="pr-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="pr-status">
                Status
              </label>
              <select
                id="pr-status"
                value={itemStatus}
                onChange={(event) => setItemStatus(event.target.value as ProvisioningRuleStatus)}
                className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="pr-days-from">
                Days from
              </label>
              <Input id="pr-days-from" value={daysFrom} onChange={(event) => setDaysFrom(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="pr-days-to">
                Days to
              </label>
              <Input id="pr-days-to" value={daysTo} onChange={(event) => setDaysTo(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="pr-rate">
                Rate (%)
              </label>
              <Input id="pr-rate" value={rate} onChange={(event) => setRate(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="pr-gl">
                GL account
              </label>
              <Input id="pr-gl" value={glAccount} onChange={(event) => setGlAccount(event.target.value)} className="h-[var(--control-height)]" />
            </div>
          </div>

          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="pr-description">
              Description
            </label>
            <textarea
              id="pr-description"
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
              {saving ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
