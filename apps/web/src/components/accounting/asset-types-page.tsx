"use client";

import { useEffect, useMemo, useState } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import {
  Archive,
  Check,
  ChevronDown,
  Folder,
  Maximize2,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import {
  createAssetType,
  getAccountingSettings,
  listAssetTypes,
  listFixedAssets,
  type AssetType,
  type FixedAsset,
  type GlAccount,
} from "@/lib/accounting";
import { titleCase } from "@/lib/privacy";

const allocationFilterOptions = [
  "Asset Status",
  "Serial Number",
  "Supplier Name",
  "Supplier Address",
  "Supplier Company",
  "Entry Date",
  "Department",
] as const;

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load asset types.";
}

function ledgerLabel(account: GlAccount) {
  return `[${account.code}] ${account.name}`;
}

function filterMatch(value: string | undefined, filter: string, condition: string) {
  if (!filter) return true;
  const normalized = (value ?? "").toLocaleLowerCase();
  const query = filter.toLocaleLowerCase();
  return condition === "IS"
    ? normalized === query
    : condition === "STARTS_WITH"
      ? normalized.startsWith(query)
      : normalized.includes(query);
}

function EmptyTable({ message = "No data available" }: { message?: string }) {
  return (
    <div
      className="flex h-[170px] flex-col items-center justify-center gap-5 text-label"
      role="status"
    >
      <Archive className="size-10 stroke-[1.8]" aria-hidden="true" />
      <span className="fs-text">{message}</span>
    </div>
  );
}

function AssetFilter({
  label,
  value,
  placeholder,
  onApply,
  type = "text",
}: {
  label: string;
  value: string;
  placeholder: string;
  onApply: (value: string, condition: string) => void;
  type?: "text" | "select";
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [condition, setCondition] = useState("CONTAINS");

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(value);
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={`Filter by ${label}`}
          aria-expanded={open}
          className="inline-flex h-[35px] translate-y-px items-center gap-2 rounded-[5px] border border-primary bg-surface px-[10px] fs-text text-primary transition-colors hover:bg-primary-tint"
        >
          <span>{label}</span>
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={10}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="z-[70] w-[350px] max-w-[calc(100vw-24px)] rounded-[5px] border border-card-border bg-surface px-[26px] py-[24.5px] text-body shadow-lg outline-none"
        >
          <h3 className="border-b border-card-border pb-[13px] fs-text font-semibold text-body">
            {label}
          </h3>
          <label
            className="mt-[10px] block fs-text font-semibold text-body"
            htmlFor={`asset-condition-${label.replaceAll(" ", "-")}`}
          >
            Condition
          </label>
          <select
            id={`asset-condition-${label.replaceAll(" ", "-")}`}
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            className="mt-2 h-[35px] w-full rounded-[5px] border border-input bg-surface px-3 fs-text text-body outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="CONTAINS">Contains</option>
            <option value="IS">Is</option>
            <option value="STARTS_WITH">Starts with</option>
          </select>
          <label
            className="mt-[15px] block fs-text font-semibold text-body"
            htmlFor={`asset-value-${label.replaceAll(" ", "-")}`}
          >
            Value
          </label>
          {type === "select" ? (
            <select
              id={`asset-value-${label.replaceAll(" ", "-")}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="mt-2 h-[35px] w-full rounded-[5px] border border-input bg-surface px-3 fs-text text-body outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="">{placeholder}</option>
              <option value="ACTIVE">Active</option>
              <option value="DISPOSED">Disposed</option>
            </select>
          ) : (
            <Input
              id={`asset-value-${label.replaceAll(" ", "-")}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={placeholder}
              className="mt-2 h-[35px] rounded-[5px] px-3"
            />
          )}
          <div className="mt-[15px] flex justify-end gap-2 border-t border-card-border pt-[13px]">
            <Button
              type="button"
              variant="outline"
              className="h-[34px] rounded-[5px] border-primary px-4 fs-text text-primary hover:bg-primary-tint"
              onClick={() => {
                setDraft("");
                onApply("", condition);
                setOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              className="h-[34px] rounded-[5px] px-4 fs-text"
              onClick={() => {
                onApply(draft, condition);
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function AddAllocationFilters({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const visible = allocationFilterOptions.filter((label) =>
    label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-expanded={open}
          className="inline-flex h-[35px] min-w-[112px] items-center justify-between gap-2 rounded-[5px] border border-primary bg-surface px-[10px] fs-text text-primary hover:bg-primary-tint"
        >
          Add Filters <ChevronDown className="size-3.5" aria-hidden="true" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={5}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="z-[70] w-[260px] rounded-[5px] border border-card-border bg-surface p-2 text-body shadow-lg outline-none"
        >
          <label className="mb-2 flex h-[35px] items-center gap-2 rounded-[4px] border border-input px-2 text-muted-foreground">
            <Search className="size-4" aria-hidden="true" />
            <input
              aria-label="Search filters"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent fs-text text-body outline-none"
            />
          </label>
          <div className="max-h-[245px] overflow-y-auto">
            {visible.map((label) => {
              const checked = selected.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() =>
                    onChange(
                      checked ? selected.filter((item) => item !== label) : [...selected, label],
                    )
                  }
                  className="flex min-h-[34px] w-full items-center gap-2 rounded px-2 text-left fs-text text-body hover:bg-primary-tint"
                >
                  <span
                    className={`grid size-4 place-items-center rounded-[3px] border ${checked ? "border-primary bg-primary text-white" : "border-input bg-white"}`}
                  >
                    {checked ? <Check className="size-3" aria-hidden="true" /> : null}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export function AssetTypesPage() {
  const [items, setItems] = useState<AssetType[]>([]);
  const [allocations, setAllocations] = useState<FixedAsset[]>([]);
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [nameCondition, setNameCondition] = useState("CONTAINS");
  const [typeFilter, setTypeFilter] = useState("");
  const [typeCondition, setTypeCondition] = useState("CONTAINS");
  const [allocationSearch, setAllocationSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [extraFilterValues, setExtraFilterValues] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [residualValue, setResidualValue] = useState("0");
  const [rate, setRate] = useState("0");
  const [ledgerAccountId, setLedgerAccountId] = useState("");
  const [depreciationLedgerAccountId, setDepreciationLedgerAccountId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<"types" | "allocations">("types");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void Promise.allSettled([listAssetTypes(), listFixedAssets(), getAccountingSettings()])
        .then(([typesResult, allocationsResult, settingsResult]) => {
          if (cancelled) return;
          if (typesResult.status === "fulfilled") {
            setItems(typesResult.value);
            setForbidden(false);
          } else if (typesResult.reason instanceof ApiError && typesResult.reason.status === 403) {
            setForbidden(true);
            setItems([]);
          } else {
            setError(failureMessage(typesResult.reason));
          }
          setAllocations(allocationsResult.status === "fulfilled" ? allocationsResult.value : []);
          if (settingsResult.status === "fulfilled") {
            const postable = settingsResult.value.accounts.filter((account) => account.isPostable);
            setAccounts(postable);
            setDepreciationLedgerAccountId(
              (current) => current || postable.find((account) => account.code === "5401")?.id || "",
            );
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reloadKey]);

  useEffect(() => {
    if (createOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    document.body.style.overflow = "";
    return undefined;
  }, [createOpen]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await createAssetType({
        name,
        residualValue,
        rate,
        ledgerAccountId,
        depreciationLedgerAccountId,
      });
      setName("");
      setResidualValue("0");
      setRate("0");
      setCreateOpen(false);
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setCreateError(failureMessage(failure));
    } finally {
      setCreating(false);
    }
  }

  const filteredTypes = useMemo(
    () => items.filter((item) => filterMatch(item.name, nameFilter, nameCondition)),
    [items, nameFilter, nameCondition],
  );
  const filteredAllocations = useMemo(
    () =>
      allocations.filter((item) => {
        const q = allocationSearch.trim().toLocaleLowerCase();
        const matchesSearch =
          !q ||
          item.description.toLocaleLowerCase().includes(q) ||
          item.assetNo.toLocaleLowerCase().includes(q);
        const matchesName = filterMatch(item.description, nameFilter, nameCondition);
        const matchesType = filterMatch(item.assetType?.name, typeFilter, typeCondition);
        const extraMatches = selectedFilters.every((label) => {
          const value = extraFilterValues[label]?.trim();
          if (!value) return true;
          const columnValue =
            label === "Asset Status"
              ? item.status
              : label === "Entry Date"
                ? item.acquisitionDate
                : label === "Department"
                  ? item.branch?.name
                  : undefined;
          return filterMatch(columnValue, value, "CONTAINS");
        });
        return matchesSearch && matchesName && matchesType && extraMatches;
      }),
    [
      allocations,
      allocationSearch,
      nameFilter,
      nameCondition,
      typeFilter,
      typeCondition,
      selectedFilters,
      extraFilterValues,
    ],
  );

  const addTypeButton = (
    <Button
      variant="outline"
      onClick={() => {
        setCreateError(null);
        setCreateOpen(true);
      }}
      className="h-[29px] gap-[5px] rounded-[5px] border-primary bg-surface px-[6px] text-[11.76px] text-primary hover:bg-primary-tint"
    >
      <Plus className="size-3.5" aria-hidden="true" />
      Add Asset Type
    </Button>
  );

  if (forbidden) {
    return (
      <div className="space-y-4">
        <header className="flex h-[70px] items-center justify-between rounded-[6px] border border-card-border bg-surface px-[16px]">
          <div className="flex items-center gap-3">
            <Folder className="size-5 text-primary" aria-hidden="true" />
            <h1 className="fs-title font-bold text-heading">Assets</h1>
          </div>
          {addTypeButton}
        </header>
        <ForbiddenPanel message="Your role cannot view asset types. Ask an administrator for Settings Accounting : View." />
      </div>
    );
  }

  return (
    <div className="space-y-[14px]">
      <header className="flex h-[70px] items-center justify-between rounded-[6px] border border-card-border bg-surface pl-[20px] pr-[20px]">
        <div className="flex items-center gap-3">
          <Folder className="size-5 text-primary" aria-hidden="true" />
          <h1 className="fs-title font-bold text-heading">Assets</h1>
        </div>
        {addTypeButton}
      </header>

      {error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : null}

      {createOpen ? (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/35 p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCreateOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="asset-type-dialog-title"
            className={`flex max-h-[calc(100vh-32px)] flex-col overflow-hidden rounded-[12px] border border-card-border bg-surface shadow-xl ${maximized ? "h-[calc(100vh-32px)] w-full" : "h-[min(511px,calc(100vh-32px))] w-[672px] max-w-full translate-y-[6px]"}`}
          >
            <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-card-border px-5">
              <h2 id="asset-type-dialog-title" className="fs-title font-semibold text-heading">
                Details
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={maximized ? "Restore" : "Maximize"}
                  onClick={() => setMaximized((value) => !value)}
                  className="grid size-8 place-items-center rounded border border-input text-label hover:bg-subtle"
                >
                  <Maximize2 className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setCreateOpen(false)}
                  className="grid size-8 place-items-center rounded text-label hover:bg-subtle"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </header>
            <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto pl-5 pr-[36px] pt-[13px]">
                <div className="space-y-[14.5px]">
                  <label className="block fs-text text-body" htmlFor="asset-type-name">
                    Asset name <span className="text-danger">*</span>
                    <Input
                      id="asset-type-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="mt-2 h-[35px] rounded-[5px]"
                      required
                    />
                  </label>
                  <label className="block fs-text text-body" htmlFor="asset-type-residual">
                    Residual Value
                    <Input
                      id="asset-type-residual"
                      type="number"
                      min="0"
                      step="0.01"
                      value={residualValue}
                      onChange={(event) => setResidualValue(event.target.value)}
                      className="mt-2 h-[35px] rounded-[5px]"
                    />
                  </label>
                  <label className="block fs-text text-body" htmlFor="asset-type-rate">
                    Rate (%) <span className="text-danger">*</span>
                    <Input
                      id="asset-type-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.0001"
                      value={rate}
                      onChange={(event) => setRate(event.target.value)}
                      className="mt-2 h-[35px] rounded-[5px]"
                      required
                    />
                  </label>
                  <label className="block fs-text text-body" htmlFor="asset-type-ledger">
                    Ledger <span className="text-danger">*</span>
                    <select
                      id="asset-type-ledger"
                      value={ledgerAccountId}
                      onChange={(event) => setLedgerAccountId(event.target.value)}
                      className="mt-2 h-[35px] w-full rounded-[5px] border border-input bg-surface px-3 fs-text text-body"
                    >
                      <option value="">Select ledger</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {ledgerLabel(account)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label
                    className="block fs-text text-body"
                    htmlFor="asset-type-depreciation-ledger"
                  >
                    Depreciation Ledger <span className="text-danger">*</span>
                    <select
                      id="asset-type-depreciation-ledger"
                      value={depreciationLedgerAccountId}
                      onChange={(event) => setDepreciationLedgerAccountId(event.target.value)}
                      className="mt-2 h-[35px] w-full rounded-[5px] border border-input bg-surface px-3 fs-text text-body"
                    >
                      <option value="">Select ledger</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {ledgerLabel(account)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {createError ? (
                  <p className="mt-3 fs-text text-accent-red" role="alert">
                    {createError}
                  </p>
                ) : null}
              </div>
              <footer className="flex h-[58px] shrink-0 items-center justify-end gap-2 border-t border-card-border px-5">
                <Button
                  type="button"
                  variant="outline"
                  className="h-[35px] rounded-[5px] px-4"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-[35px] rounded-[5px] px-4"
                  disabled={
                    creating ||
                    !name.trim() ||
                    !rate ||
                    !ledgerAccountId ||
                    !depreciationLedgerAccountId
                  }
                >
                  {creating ? "Saving..." : "Save"}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[5px] border border-card-border bg-surface">
        <div
          role="tablist"
          aria-label="Asset sections"
          className="flex h-[45px] items-stretch bg-subtle px-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "types"}
            onClick={() => {
              setActiveTab("types");
              setNameFilter("");
            }}
            className={`min-w-[100px] border-b-2 px-4 fs-text font-medium transition-colors ${activeTab === "types" ? "border-primary bg-surface text-primary" : "border-transparent text-muted-foreground hover:text-strong"}`}
          >
            Asset Type
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "allocations"}
            onClick={() => {
              setActiveTab("allocations");
              setNameFilter("");
            }}
            className={`min-w-[131px] border-b-2 px-4 fs-text font-medium transition-colors ${activeTab === "allocations" ? "border-primary bg-surface text-primary" : "border-transparent text-muted-foreground hover:text-strong"}`}
          >
            Asset Allocation
          </button>
        </div>

        <div className="px-[15px] pb-[15px] pt-[11px]">
          <div className="flex min-h-[56px] flex-wrap items-center gap-[8px] border border-card-border px-[10px] py-[9px]">
            {activeTab === "types" ? (
              <AssetFilter
                label="Name"
                value={nameFilter}
                onApply={(value, condition) => {
                  setNameFilter(value);
                  setNameCondition(condition);
                }}
                placeholder="Enter Name"
              />
            ) : (
              <>
                <label className="relative h-[35px] w-[212px] max-w-full">
                  <Search
                    className="pointer-events-none absolute left-[9px] top-1/2 size-4 -translate-y-1/2 text-label"
                    aria-hidden="true"
                  />
                  <Input
                    aria-label="Search asset allocations"
                    value={allocationSearch}
                    onChange={(event) => setAllocationSearch(event.target.value)}
                    placeholder="Search..."
                    className="h-[35px] rounded-[5px] pl-8"
                  />
                </label>
                <AssetFilter
                  label="Name"
                  value={nameFilter}
                  onApply={(value, condition) => {
                    setNameFilter(value);
                    setNameCondition(condition);
                  }}
                  placeholder="Enter Name"
                />
                <AssetFilter
                  label="Asset Type"
                  value={typeFilter}
                  onApply={(value, condition) => {
                    setTypeFilter(value);
                    setTypeCondition(condition);
                  }}
                  placeholder="Enter Asset Type"
                />
                <AddAllocationFilters selected={selectedFilters} onChange={setSelectedFilters} />
                {selectedFilters.map((label) => (
                  <label
                    key={label}
                    className="inline-flex h-[35px] items-center gap-2 rounded-[5px] border border-card-border px-2 fs-text text-body"
                  >
                    {label}
                    <input
                      aria-label={`Filter by ${label}`}
                      value={extraFilterValues[label] ?? ""}
                      onChange={(event) =>
                        setExtraFilterValues((current) => ({
                          ...current,
                          [label]: event.target.value,
                        }))
                      }
                      placeholder={`Enter ${label}`}
                      className="w-[120px] bg-transparent outline-none"
                    />
                  </label>
                ))}
              </>
            )}
          </div>

          {loading ? (
            <div className="mt-0">
              <PanelSkeleton rows={4} />
            </div>
          ) : (
            <div className={`overflow-x-auto ${activeTab === "allocations" ? "mt-0" : ""}`}>
              <table
                className={`w-full table-fixed text-left fs-text ${activeTab === "types" ? "min-w-[966px]" : "min-w-[1245px]"}`}
              >
                <thead className="h-[37px] border-b border-card-border bg-subtle font-semibold text-label">
                  {activeTab === "types" ? (
                    <tr>
                      <th className="w-[47%] px-3">Name</th>
                      <th className="w-[49%] px-3">Ledger</th>
                      <th className="w-[4%] px-3 text-center">
                        <span className="sr-only">Actions</span>
                        <SlidersHorizontal className="mx-auto size-4" aria-hidden="true" />
                      </th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-3">External Asset ID</th>
                      <th className="px-3">Name</th>
                      <th className="px-3">Asset Type</th>
                      <th className="px-3">Asset Status</th>
                      <th className="px-3">Serial Number</th>
                      <th className="px-3">Supplier Name</th>
                      <th className="px-3">Supplier Address</th>
                      <th className="px-3">Supplier Company</th>
                      <th className="px-3">Entry Date</th>
                      <th className="px-3">Department</th>
                      <th className="px-3">User</th>
                      <th className="w-10 px-3 text-center">
                        <span className="sr-only">Actions</span>
                        <SlidersHorizontal className="mx-auto size-4" aria-hidden="true" />
                      </th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {activeTab === "types" ? (
                    filteredTypes.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="!p-0">
                          <EmptyTable />
                        </td>
                      </tr>
                    ) : (
                      filteredTypes.map((item) => {
                        const ledger = accounts.find(
                          (account) => account.id === item.ledgerAccountId,
                        );
                        return (
                          <tr
                            key={item.id}
                            className="h-[48px] border-b border-card-border last:border-0"
                          >
                            <td className="whitespace-nowrap px-3 font-medium text-strong">
                              {item.name}
                            </td>
                            <td className="whitespace-nowrap px-3 text-body">
                              {ledger ? ledgerLabel(ledger) : "—"}
                            </td>
                            <td className="px-3" />
                          </tr>
                        );
                      })
                    )
                  ) : filteredAllocations.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="!p-0">
                        <EmptyTable />
                      </td>
                    </tr>
                  ) : (
                    filteredAllocations.map((item) => (
                      <tr
                        key={item.id}
                        className="h-[48px] border-b border-card-border last:border-0"
                      >
                        <td className="whitespace-nowrap px-3 font-medium text-strong">
                          {item.assetNo}
                        </td>
                        <td className="whitespace-nowrap px-3 text-body">{item.description}</td>
                        <td className="whitespace-nowrap px-3 text-body">
                          {item.assetType?.name ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 text-body">
                          {titleCase(item.status)}
                        </td>
                        <td className="px-3 text-body">—</td>
                        <td className="px-3 text-body">—</td>
                        <td className="px-3 text-body">—</td>
                        <td className="px-3 text-body">—</td>
                        <td className="whitespace-nowrap px-3 text-body">
                          {new Date(item.acquisitionDate).toLocaleDateString()}
                        </td>
                        <td className="px-3 text-body">—</td>
                        <td className="px-3 text-body">—</td>
                        <td className="px-3" />
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
