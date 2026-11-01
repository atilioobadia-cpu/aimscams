"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LoaderCircle, Plus, Search, SlidersHorizontal, UserCheck, UserX } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton, FormError, SuccessNote } from "@/components/accounting/states";
import { RowActionsMenu } from "@/components/data/row-actions-menu";
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
import {
  createProvisioningRule,
  listProvisioningRules,
  updateProvisioningRule,
  type ProvisioningRule,
  type ProvisioningRuleStatus,
} from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

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
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showStatusColumn, setShowStatusColumn] = useState(true);
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
  const columnCount = 2 + Number(showStatusColumn);

  return (
    <div className="space-y-3">
      <ProductSetupHeader active="provisioning-rules" />
      {data?.canEdit ? <div className="flex justify-end px-[var(--space-16)]"><Button type="button" variant="outline" onClick={() => setModalOpen(true)} className="h-[42px] border-primary px-4 text-primary hover:bg-primary-tint hover:text-primary"><Plus className="size-4" aria-hidden="true" />Add new</Button></div> : null}

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view provisioning rules. Ask an administrator for Settings Product : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <div className="flex min-h-[71px] flex-wrap items-center gap-4 border-b border-chrome px-[var(--space-12)] py-3">
              <label className="relative block w-[240px] max-w-full"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" /><Input id="provisioning-search" aria-label="Search provisioning rules" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-[42px] border-primary pl-10 text-primary placeholder:text-primary" /></label>
              <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="outline" className="h-[42px] min-w-[168px] justify-between border-primary px-3 text-primary hover:bg-primary-tint hover:text-primary"><span className="flex items-center gap-2"><Plus className="size-4" aria-hidden="true" />Add Filters</span><ChevronDown className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuCheckboxItem checked={showStatusFilter} onCheckedChange={setShowStatusFilter}>Status</DropdownMenuCheckboxItem></DropdownMenuContent></DropdownMenu>
              {hasFilters ? <Button type="button" variant="ghost" onClick={() => { setQuery(""); setStatus(""); }} className="text-muted-foreground">Clear</Button> : null}
              {loading ? <LoaderCircle className="size-4 animate-spin text-primary" aria-label="Updating provisioning rules" /> : null}
            </div>
            {showStatusFilter ? <div className="border-b border-chrome px-[var(--space-12)] py-3"><select id="provisioning-status" aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-[42px] min-w-[180px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div> : null}
            <table className="w-full min-w-[760px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold text-label">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  {showStatusColumn ? <th className="px-4 py-3">Status</th> : null}
                  <th className="w-14 px-2 py-2 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label="Table columns" className="text-primary"><SlidersHorizontal className="size-4" aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuCheckboxItem checked={showStatusColumn} onCheckedChange={setShowStatusColumn}>Status</DropdownMenuCheckboxItem></DropdownMenuContent></DropdownMenu></th>
                </tr>
              </thead>
              <tbody className="text-body">
                {items.length === 0 ? <tr><td colSpan={columnCount} className="h-[216px] px-4 text-center text-muted-foreground"><div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-subtle text-muted-foreground"><Search className="size-6" aria-hidden="true" /></div>{hasFilters ? "No provisioning rules match these filters." : "No data available"}</td></tr> : null}
                {items.map((item) => (
                  <tr key={item.id} className="h-[67px] border-b border-card-border last:border-0">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    {showStatusColumn ? <td className="px-4 py-3"><Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{titleCase(item.status)}</Badge></td> : null}
                    <td className="w-14 bg-subtle/40 px-2 py-3">
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
