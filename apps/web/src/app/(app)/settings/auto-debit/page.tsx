"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Inbox,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserCheck,
  UserX,
} from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton, FormError } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu, type RowAction } from "@/components/data/row-actions-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import {
  createAutoDebitRule,
  listAutoDebitRules,
  updateAutoDebitRule,
  type AutoDebitRule,
  type AutoDebitRuleStatus,
} from "@/lib/settings";
import { titleCase } from "@/lib/privacy";
import { cn } from "cn";

const TRIGGER_OPTIONS = [
  "Due date",
  "Grace period end",
  "Monthly cycle",
  "Fee posting",
  "Missed instalment",
];

type ColumnKey =
  | "rule"
  | "name"
  | "productName"
  | "sourceProduct"
  | "triggerEvents"
  | "priority"
  | "requiresConsent"
  | "overridable"
  | "status";

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "rule", label: "Rule" },
  { key: "name", label: "Name" },
  { key: "productName", label: "Product/Charge Name" },
  { key: "sourceProduct", label: "Source Product" },
  { key: "triggerEvents", label: "Trigger Events" },
  { key: "priority", label: "Priority" },
  { key: "requiresConsent", label: "Requires Consent" },
  { key: "overridable", label: "Overridable" },
  { key: "status", label: "Status" },
];

type RuleFilterField = "code" | "name" | "productName" | "sourceProduct" | "priority" | "status";

const RULE_FILTER_FIELDS: { value: RuleFilterField; label: string }[] = [
  { value: "code", label: "Rule" },
  { value: "name", label: "Name" },
  { value: "productName", label: "Product/Charge Name" },
  { value: "sourceProduct", label: "Source Product" },
  { value: "priority", label: "Priority" },
  { value: "status", label: "Status" },
];

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function formatEvents(events: string[]): string {
  return events.length > 0 ? events.join(", ") : "N/A";
}

function YesNo({ value }: { value: boolean }) {
  return <span>{value ? "Yes" : "No"}</span>;
}

export default function AutoDebitSettingsPage() {
  const { pushToast } = useToast();
  const [data, setData] = useState<Awaited<ReturnType<typeof listAutoDebitRules>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);

  const [query, setQuery] = useState("");
  const [ruleCondition, setRuleCondition] = useState<"contains" | "is">("is");
  const [ruleValue, setRuleValue] = useState("");
  const [appliedRule, setAppliedRule] = useState<{ field: RuleFilterField; condition: "contains" | "is"; value: string } | null>(null);

  const [showStatus, setShowStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [showSourceProduct, setShowSourceProduct] = useState(false);
  const [sourceProductFilter, setSourceProductFilter] = useState("");
  const [showTriggerEvents, setShowTriggerEvents] = useState(false);
  const [triggerEventsFilter, setTriggerEventsFilter] = useState("");
  const [showRequiresConsent, setShowRequiresConsent] = useState(false);
  const [requiresConsentFilter, setRequiresConsentFilter] = useState("");
  const [showOverridable, setShowOverridable] = useState(false);
  const [overridableFilter, setOverridableFilter] = useState("");

  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
    rule: true,
    name: true,
    productName: true,
    sourceProduct: true,
    triggerEvents: true,
    priority: true,
    requiresConsent: true,
    overridable: true,
    status: true,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AutoDebitRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [productName, setProductName] = useState("");
  const [sourceProduct, setSourceProduct] = useState("");
  const [triggerEvents, setTriggerEvents] = useState<string[]>(["Due date"]);
  const [priority, setPriority] = useState("1");
  const [requiresConsent, setRequiresConsent] = useState(true);
  const [overridable, setOverridable] = useState(false);
  const [itemStatus, setItemStatus] = useState<AutoDebitRuleStatus>("ACTIVE");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);
        void listAutoDebitRules({ q: query })
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
              setError(message(failure, "Could not load auto debit rules."));
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
  }, [query, reloadKey]);

  function resetForm() {
    setEditing(null);
    setCode("");
    setName("");
    setProductName("");
    setSourceProduct("");
    setTriggerEvents(["Due date"]);
    setPriority("1");
    setRequiresConsent(true);
    setOverridable(false);
    setItemStatus("ACTIVE");
    setDescription("");
    setSaveError(null);
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(item: AutoDebitRule) {
    setEditing(item);
    setCode(item.code);
    setName(item.name);
    setProductName(item.productName);
    setSourceProduct(item.sourceProduct);
    setTriggerEvents(item.triggerEvents.length > 0 ? item.triggerEvents : ["Due date"]);
    setPriority(String(item.priority));
    setRequiresConsent(item.requiresConsent);
    setOverridable(item.overridable);
    setItemStatus(item.status);
    setDescription(item.description ?? "");
    setSaveError(null);
    setModalOpen(true);
  }

  function toggleTrigger(event: string, checked: boolean) {
    setTriggerEvents((current) =>
      checked ? [...current.filter((entry) => entry !== event), event] : current.filter((entry) => entry !== event),
    );
  }

  async function save(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setSaveError(null);

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) return setSaveError("Code is required.");
    if (!name.trim()) return setSaveError("Name is required.");
    if (!productName.trim()) return setSaveError("Product or charge name is required.");
    if (!sourceProduct.trim()) return setSaveError("Source product is required.");
    if (triggerEvents.length === 0) return setSaveError("Select at least one trigger event.");
    const priorityNumber = Number(priority);
    if (!Number.isInteger(priorityNumber) || priorityNumber < 1) {
      return setSaveError("Priority must be a whole number of 1 or more.");
    }

    const payload = {
      code: trimmedCode,
      name: name.trim(),
      productName: productName.trim(),
      sourceProduct: sourceProduct.trim(),
      triggerEvents,
      priority: priorityNumber,
      requiresConsent,
      overridable,
      status: itemStatus,
      description: description.trim() || null,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateAutoDebitRule(editing.id, payload);
        pushToast("Auto debit rule updated.");
      } else {
        await createAutoDebitRule(payload);
        pushToast("Auto debit rule created.");
      }
      setModalOpen(false);
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setSaveError(message(failure, "Could not save this auto debit rule."));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item: AutoDebitRule) {
    try {
      const next: AutoDebitRuleStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await updateAutoDebitRule(item.id, { status: next });
      pushToast(`Rule ${next === "ACTIVE" ? "activated" : "deactivated"}.`);
      setReloadKey((value) => value + 1);
    } catch (failure) {
      pushToast(message(failure, "Could not update this rule."));
    }
  }

  const allItems = data?.items ?? [];
  const ruleValueOptions = [...new Set(allItems.map((item) => item.code))].sort();
  const items = allItems.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (sourceProductFilter && item.sourceProduct !== sourceProductFilter) return false;
    if (triggerEventsFilter && !item.triggerEvents.includes(triggerEventsFilter)) return false;
    if (requiresConsentFilter && String(item.requiresConsent) !== requiresConsentFilter) return false;
    if (overridableFilter && String(item.overridable) !== overridableFilter) return false;
    if (!appliedRule || !appliedRule.value.trim()) return true;
    const raw = item[appliedRule.field];
    const value = String(raw ?? "").toLowerCase();
    const needle = appliedRule.value.trim().toLowerCase();
    return appliedRule.condition === "is" ? value === needle : value.includes(needle);
  });

  const activeColumns = COLUMNS.filter((column) => visibleColumns[column.key]);
  const hasFilters = Boolean(query.trim() || statusFilter || appliedRule);
  const columnCount = activeColumns.length + 1;

  return (
    <div>
      <PageHeader
        variant="card"
        iconPlain
        icon={<RefreshCw className="size-[20.1667px] text-primary" strokeWidth={2} aria-hidden="true" />}
        title="Auto Debit Rules"
        titleClassName="text-[20.16px] font-semibold leading-[normal] tracking-[normal]"
      />

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view auto debit rules. Ask an administrator for Settings Auto Debit : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[8px] border-[0.666667px] border-[#dee2e6] bg-white">
          <PanelSkeleton rows={6} />
        </section>
      ) : (
        <section
          data-parity="auto-debit-card"
          className="rounded-[8px] border-[0.666667px] border-[#dee2e6] bg-white"
        >
          <div
            role="toolbar"
            data-parity="auto-debit-toolbar"
            className="flex h-[56.406px] items-center gap-[6.72px] rounded-[6px] border-[0.666667px] border-[#dee2e6] bg-white p-[10.08px]"
          >
            <div className="flex items-center gap-[6.72px]">
              <label className="relative block h-[34.125px] w-[191px]">
                <Search
                  className="pointer-events-none absolute top-1/2 left-[10.08px] size-[13.44px] -translate-y-1/2 text-primary"
                  aria-hidden="true"
                />
                <input
                  id="auto-debit-search"
                  aria-label="Search auto debit rules"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  className="!h-[34.125px] !w-[191px] !rounded-[6px] !border-[0.666667px] !border-primary !bg-white !py-[8.4px] !pr-[10.08px] !pl-[33.6px] !text-[13.44px] !font-normal !text-[#495057] outline-none placeholder:text-[#6c757d]"
                />
              </label>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Filter by Rule"
                    className="inline-flex h-[34.927px] items-center gap-[6.72px] rounded-[6px] border-[0.666667px] border-primary bg-transparent px-[8.4px] py-[6.72px] text-[11.76px] font-medium text-primary"
                  >
                    <span className="block text-[11.76px] leading-[normal]">{appliedRule ? titleCase(appliedRule.field) : "Rule"}</span>
                    <ChevronDown className="mr-[3.36px] size-[13.44px]" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  sideOffset={10.08}
                  className="w-[350px] overflow-visible rounded-[6px] border-[0.666667px] border-[#dee2e6] bg-white p-[13.44px] shadow-[0_2px_12px_rgba(0,0,0,0.1)]"
                >
                  <div className="p-[13.44px]">
                    <div className="mb-[13.44px] pb-[10.08px]">
                      <h4 className="text-[13.44px] font-semibold text-[#495057]">Rule</h4>
                    </div>
                    <div className="mb-[13.44px]">
                      <label className="mb-[6.72px] block text-[13.44px] font-medium text-[#495057]">Condition</label>
                      <select
                        aria-label="Rule filter condition"
                        value={ruleCondition}
                        onChange={(event) => setRuleCondition(event.target.value as "contains" | "is")}
                        className="h-[34.125px] w-full rounded-[6px] border-[0.666667px] border-[#ced4da] bg-white px-[8.4px] text-[13.44px] text-[#495057] outline-none"
                      >
                        <option value="contains">Contains</option>
                        <option value="is">Is</option>
                      </select>
                    </div>
                    <div className="mb-[13.44px]">
                      <label className="mb-[6.72px] block text-[13.44px] font-medium text-[#495057]">Value</label>
                      <select
                        aria-label="Rule filter value"
                        value={ruleValue}
                        onChange={(event) => setRuleValue(event.target.value)}
                        className="h-[34.125px] w-full rounded-[6px] border-[0.666667px] border-[#ced4da] bg-white px-[8.4px] text-[13.44px] text-[#495057] outline-none"
                      >
                        <option value="">Select value</option>
                        {ruleValueOptions.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-[11.52px] pt-[15.36px] mt-[23.04px]">
                      <button
                        type="button"
                        onClick={() => {
                          setRuleValue("");
                          setAppliedRule(null);
                        }}
                        className="inline-flex h-[34.125px] items-center justify-center rounded-[6px] border-[0.666667px] border-primary bg-white px-[13.44px] py-[8.4px] text-[13.44px] font-medium text-primary"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setAppliedRule(ruleValue.trim() ? { field: "code", condition: ruleCondition, value: ruleValue } : null)
                        }
                        disabled={!ruleValue.trim()}
                        className={cn(
                          "inline-flex h-[34.125px] items-center justify-center rounded-[6px] border-[0.666667px] px-[13.44px] py-[8.4px] text-[13.44px] font-medium",
                          ruleValue.trim()
                            ? "border-primary bg-primary text-white"
                            : "border-[#dee2e6] bg-[#e9ecef] text-[#6c757d]",
                        )}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-[32.125px] w-[132.104px] items-center rounded-[6px] border-[0.666667px] border-primary bg-transparent text-[11.76px] font-medium text-primary"
                  >
                    <span className="flex w-[97.177px] items-center gap-[3.36px] px-[10.08px] py-[8.4px]">
                      <Plus className="size-[13.44px]" aria-hidden="true" />
                      <span className="block text-[11.76px] leading-[normal]">Add Filters</span>
                    </span>
                    <ChevronDown className="ml-auto mr-[6.72px] size-[10.08px]" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuCheckboxItem checked={showSourceProduct} onCheckedChange={(checked) => {
                      setShowSourceProduct(Boolean(checked));
                      if (!checked) setSourceProductFilter("");
                    }}>
                      Source Product Type
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={showTriggerEvents} onCheckedChange={(checked) => {
                      setShowTriggerEvents(Boolean(checked));
                      if (!checked) setTriggerEventsFilter("");
                    }}>
                      Trigger Events
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={showRequiresConsent} onCheckedChange={(checked) => {
                      setShowRequiresConsent(Boolean(checked));
                      if (!checked) setRequiresConsentFilter("");
                    }}>
                      Requires Consent
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={showOverridable} onCheckedChange={(checked) => {
                      setShowOverridable(Boolean(checked));
                      if (!checked) setOverridableFilter("");
                    }}>
                      Overridable
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={showStatus} onCheckedChange={(checked) => {
                      setShowStatus(Boolean(checked));
                      if (!checked) setStatusFilter("");
                    }}>
                      Status
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {showStatus || showSourceProduct || showTriggerEvents || showRequiresConsent || showOverridable ? (
            <div className="flex flex-wrap gap-[6.72px] border-b-[0.666667px] border-[#e2e8f0] px-[10.08px] py-[6.72px]">
              {showStatus ? (
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-[34.13px] min-w-[180px] rounded-[6px] border-[0.666667px] border-[#ced4da] bg-white px-[8.4px] text-[13.44px] text-[#495057] outline-none"
                >
                  <option value="">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              ) : null}
              {showSourceProduct ? (
                <select
                  aria-label="Filter by source product"
                  value={sourceProductFilter}
                  onChange={(event) => setSourceProductFilter(event.target.value)}
                  className="h-[34.13px] min-w-[180px] rounded-[6px] border-[0.666667px] border-[#ced4da] bg-white px-[8.4px] text-[13.44px] text-[#495057] outline-none"
                >
                  <option value="">All source products</option>
                  {[...new Set(allItems.map((item) => item.sourceProduct))].sort().map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              ) : null}
              {showTriggerEvents ? (
                <select
                  aria-label="Filter by trigger event"
                  value={triggerEventsFilter}
                  onChange={(event) => setTriggerEventsFilter(event.target.value)}
                  className="h-[34.13px] min-w-[180px] rounded-[6px] border-[0.666667px] border-[#ced4da] bg-white px-[8.4px] text-[13.44px] text-[#495057] outline-none"
                >
                  <option value="">All trigger events</option>
                  {TRIGGER_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              ) : null}
              {showRequiresConsent ? (
                <select
                  aria-label="Filter by consent"
                  value={requiresConsentFilter}
                  onChange={(event) => setRequiresConsentFilter(event.target.value)}
                  className="h-[34.13px] min-w-[180px] rounded-[6px] border-[0.666667px] border-[#ced4da] bg-white px-[8.4px] text-[13.44px] text-[#495057] outline-none"
                >
                  <option value="">All consent settings</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : null}
              {showOverridable ? (
                <select
                  aria-label="Filter by overridable"
                  value={overridableFilter}
                  onChange={(event) => setOverridableFilter(event.target.value)}
                  className="h-[34.13px] min-w-[180px] rounded-[6px] border-[0.666667px] border-[#ced4da] bg-white px-[8.4px] text-[13.44px] text-[#495057] outline-none"
                >
                  <option value="">All overridable settings</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : null}
              {hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("");
                    setSourceProductFilter("");
                    setTriggerEventsFilter("");
                    setRequiresConsentFilter("");
                    setOverridableFilter("");
                    setAppliedRule(null);
                    setRuleValue("");
                  }}
                  className="h-[34.13px] rounded-[6px] border-[0.666667px] border-[#ced4da] px-[10.08px] text-[11.76px] font-medium text-[#6c757d]"
                >
                  Clear
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="dashboard-parity-table w-full border-separate border-spacing-0 text-left text-[13.44px]">
              <thead className="sticky bg-[#f8fafc]">
                <tr>
                  {activeColumns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="min-w-[84px] border-b-[0.666667px] border-[#e2e8f0] bg-[#f8fafc] px-[13.44px] !py-[9.09px] text-left align-middle text-[13.44px] font-bold text-[#495057]"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="w-[63.83px] border-b-[0.666667px] border-[#e2e8f0] bg-[#f8fafc] px-[13.44px] !py-[9.09px] text-right align-middle"
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Table columns"
                          className="inline-flex h-[14.67px] w-[36.96px] items-center justify-center text-primary"
                        >
                          <SlidersHorizontal className="size-[14.67px]" aria-hidden="true" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        {COLUMNS.map((column) => (
                          <DropdownMenuCheckboxItem
                            key={column.key}
                            checked={visibleColumns[column.key]}
                            onCheckedChange={(checked) =>
                              setVisibleColumns((current) => ({ ...current, [column.key]: Boolean(checked) }))
                            }
                          >
                            {column.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                        {data?.canEdit ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="px-2 py-1 text-[10.08px] font-semibold tracking-wide text-muted-foreground uppercase">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => setTimeout(openCreate, 0)}>
                              <Plus className="size-3.5" aria-hidden="true" />
                              New rule
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className="border-b-[0.666667px] border-[#e2e8f0] px-[13.44px] py-[10.08px] text-[13.44px] text-[#495057]"
                    >
                      <div className="p-[26.88px] text-center">
                        <Inbox
                          className="mb-[13.44px] inline-block size-[40.32px] text-[#6c757d]"
                          strokeWidth={1}
                          aria-hidden="true"
                        />
                        <p className="my-[13.44px] text-[13.44px] leading-[normal] text-[#6c757d]">
                          No data available
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const actions: RowAction[] = data?.canEdit
                      ? [
                          { label: "Edit", icon: Pencil, onSelect: () => openEdit(item) },
                          {
                            label: item.status === "ACTIVE" ? "Deactivate" : "Activate",
                            icon: item.status === "ACTIVE" ? UserX : UserCheck,
                            onSelect: () => void toggleStatus(item),
                            separatorBefore: true,
                          },
                        ]
                      : [];
                    return (
                      <tr key={item.id} className="bg-white">
                        {visibleColumns.rule ? (
                          <td className="border-b-[0.666667px] border-[#e2e8f0] px-[13.44px] py-[10.08px] font-medium text-[#495057]">
                            {item.code}
                          </td>
                        ) : null}
                        {visibleColumns.name ? (
                          <td className="border-b-[0.666667px] border-[#e2e8f0] px-[13.44px] py-[10.08px] text-[#495057]">
                            {item.name}
                          </td>
                        ) : null}
                        {visibleColumns.productName ? (
                          <td className="border-b-[0.666667px] border-[#e2e8f0] px-[13.44px] py-[10.08px] text-[#495057]">
                            {item.productName}
                          </td>
                        ) : null}
                        {visibleColumns.sourceProduct ? (
                          <td className="border-b-[0.666667px] border-[#e2e8f0] px-[13.44px] py-[10.08px] text-[#495057]">
                            {item.sourceProduct}
                          </td>
                        ) : null}
                        {visibleColumns.triggerEvents ? (
                          <td className="border-b-[0.666667px] border-[#e2e8f0] px-[13.44px] py-[10.08px] text-[#495057]">
                            {formatEvents(item.triggerEvents)}
                          </td>
                        ) : null}
                        {visibleColumns.priority ? (
                          <td className="border-b-[0.666667px] border-[#e2e8f0] px-[13.44px] py-[10.08px] text-[#495057]">
                            {item.priority}
                          </td>
                        ) : null}
                        {visibleColumns.requiresConsent ? (
                          <td className="border-b-[0.666667px] border-[#e2e8f0] px-[13.44px] py-[10.08px] text-[#495057]">
                            <YesNo value={item.requiresConsent} />
                          </td>
                        ) : null}
                        {visibleColumns.overridable ? (
                          <td className="border-b-[0.666667px] border-[#e2e8f0] px-[13.44px] py-[10.08px] text-[#495057]">
                            <YesNo value={item.overridable} />
                          </td>
                        ) : null}
                        {visibleColumns.status ? (
                          <td className="border-b-[0.666667px] border-[#e2e8f0] px-[13.44px] py-[10.08px]">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-[6px] px-[6.72px] py-[1.68px] text-[11.76px] font-medium",
                                item.status === "ACTIVE"
                                  ? "bg-[#e1eeee] text-[#057573]"
                                  : "bg-[#f1f3f5] text-[#6c757d]",
                              )}
                            >
                              {titleCase(item.status)}
                            </span>
                          </td>
                        ) : null}
                        <td className="border-b-[0.666667px] border-[#e2e8f0] px-[13.44px] py-[10.08px] text-right">
                          <RowActionsMenu
                            label={`${item.code} ${item.name}`}
                            actions={actions}
                            className="h-[14.67px] w-[36.96px] text-primary [&_svg]:size-[13.44px]"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Auto Debit Rule" size="large">
        <form className="space-y-5" onSubmit={(event) => void save(event)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="ad-code">
                Rule
              </label>
              <Input id="ad-code" value={code} onChange={(event) => setCode(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="ad-name">
                Name <span className="text-accent-red" aria-hidden="true">*</span>
              </label>
              <Input id="ad-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="ad-product">
                Product/Charge Name <span className="text-accent-red" aria-hidden="true">*</span>
              </label>
              <Input id="ad-product" value={productName} onChange={(event) => setProductName(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="ad-source">
                Source Product <span className="text-accent-red" aria-hidden="true">*</span>
              </label>
              <Input id="ad-source" value={sourceProduct} onChange={(event) => setSourceProduct(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="ad-priority">
                Priority <span className="text-accent-red" aria-hidden="true">*</span>
              </label>
              <Input id="ad-priority" type="number" min={1} step={1} value={priority} onChange={(event) => setPriority(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="ad-status">
                Status
              </label>
              <select
                id="ad-status"
                value={itemStatus}
                onChange={(event) => setItemStatus(event.target.value as AutoDebitRuleStatus)}
                className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 block fs-text font-medium text-body">Trigger events</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {TRIGGER_OPTIONS.map((event) => (
                <label key={event} className="flex items-center gap-2 fs-text text-body">
                  <input
                    type="checkbox"
                    checked={triggerEvents.includes(event)}
                    onChange={(changeEvent) => toggleTrigger(event, changeEvent.target.checked)}
                    className="size-4 accent-[#057573]"
                  />
                  {event}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 fs-text text-body">
              <input
                type="checkbox"
                checked={requiresConsent}
                onChange={(event) => setRequiresConsent(event.target.checked)}
                className="size-4 accent-[#057573]"
              />
              Requires consent
            </label>
            <label className="flex items-center gap-2 fs-text text-body">
              <input
                type="checkbox"
                checked={overridable}
                onChange={(event) => setOverridable(event.target.checked)}
                className="size-4 accent-[#057573]"
              />
              Overridable
            </label>
          </div>

          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="ad-description">
              Description
            </label>
            <textarea
              id="ad-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] py-[var(--space-8)] fs-text"
            />
          </div>

          <FormError message={saveError} />

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
