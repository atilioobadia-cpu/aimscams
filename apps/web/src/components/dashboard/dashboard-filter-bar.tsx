"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";

import { Button } from "@/components/ui/button";

export type DashboardFilterKey = "branch" | "gender" | "age" | "clientType" | "product" | "date";
export type DashboardFilters = Record<DashboardFilterKey, string>;

type DashboardFilterBarProps = {
  filters: DashboardFilters;
  branches: string[];
  products: string[];
  onChange: (key: DashboardFilterKey, value: string) => void;
};

type FilterOption = { value: string; label: string };

const staticOptions: Record<Exclude<DashboardFilterKey, "branch" | "product" | "date">, FilterOption[]> = {
  gender: [
    { value: "ALL", label: "All" },
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "UNDEFINED", label: "Not Defined" },
  ],
  age: [
    { value: "ALL", label: "All" },
    { value: "UNDER_25", label: "<25" },
    { value: "25_34", label: "25-34" },
    { value: "35_44", label: "35-44" },
    { value: "45_54", label: "45-54" },
    { value: "55_PLUS", label: "55+" },
    { value: "UNDEFINED", label: "Not Defined" },
  ],
  clientType: [
    { value: "ALL", label: "All" },
    { value: "COMPANY", label: "Company" },
    { value: "GROUP", label: "Group" },
    { value: "GROUP_MEMBER", label: "Group Member" },
    { value: "INDIVIDUAL", label: "Individual" },
  ],
};

const filters: Array<{ key: DashboardFilterKey; label: string }> = [
  { key: "branch", label: "Branch" },
  { key: "gender", label: "Gender" },
  { key: "age", label: "Age" },
  { key: "clientType", label: "Client Type" },
  { key: "product", label: "Product" },
  { key: "date", label: "Date" },
];

function dateText(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function DateFilter({ value, onApply }: { value: string; onApply: (value: string) => void }) {
  const existingDate = value.startsWith("ON:") ? value.slice(3) : "";
  const [month, setMonth] = useState(() => {
    const parsed = existingDate ? new Date(`${existingDate}T00:00:00`) : new Date();
    return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
  });
  const [draftDate, setDraftDate] = useState(existingDate);

  const days = useMemo(() => {
    const offset = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const priorMonthDays = new Date(month.getFullYear(), month.getMonth(), 0).getDate();
    return Array.from({ length: 42 }, (_, index) => {
      const day = index - offset + 1;
      if (day < 1) {
        const date = new Date(month.getFullYear(), month.getMonth() - 1, priorMonthDays + day);
        return { date, outside: true };
      }
      if (day > daysInMonth) {
        const date = new Date(month.getFullYear(), month.getMonth() + 1, day - daysInMonth);
        return { date, outside: true };
      }
      return { date: new Date(month.getFullYear(), month.getMonth(), day), outside: false };
    });
  }, [month]);

  function formatDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  return (
    <div className="w-[524px] max-w-[calc(100vw-32px)] rounded-md border border-card-border bg-surface p-5 shadow-lg">
      <div className="flex h-10 items-center justify-between border-b border-card-border pb-3">
        <button type="button" aria-label="Previous month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="grid size-8 place-items-center rounded-full text-primary hover:bg-primary-tint"><ChevronLeft className="size-4" /></button>
        <div className="flex gap-8 fs-text font-semibold text-body">
          <span>{month.toLocaleDateString("en-US", { month: "long" })}</span>
          <span>{month.getFullYear()}</span>
        </div>
        <button type="button" aria-label="Next month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="grid size-8 place-items-center rounded-full text-primary hover:bg-primary-tint"><ChevronRight className="size-4" /></button>
      </div>
      <div className="mt-3 grid grid-cols-7 text-center fs-text font-semibold text-label">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day} className="py-2">{day}</span>)}
      </div>
      <div className="grid grid-cols-7 text-center">
        {days.map(({ date, outside }) => {
          const dateValue = formatDate(date);
          const selected = dateValue === draftDate;
          return (
            <button
              key={dateValue}
              type="button"
              aria-label={date.toLocaleDateString("en-US", { dateStyle: "full" })}
              aria-pressed={selected}
              onClick={() => { setDraftDate(dateValue); setMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }}
              className={`mx-auto my-1 grid size-9 place-items-center rounded-full fs-text transition-colors hover:bg-primary-tint ${selected ? "border border-primary bg-primary-tint text-primary" : outside ? "text-muted-foreground/60" : "text-body"}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-2 border-t border-card-border pt-4">
        <div className="flex h-11 overflow-hidden rounded-[var(--control-radius)] border border-input focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
          <input aria-label="Selected date" type="date" value={draftDate} onChange={(event) => setDraftDate(event.target.value)} className="min-w-0 flex-1 bg-surface px-3 fs-text text-body outline-none" />
          <span className="grid w-12 place-items-center border-l border-input bg-subtle text-body"><CalendarDays className="size-4" /></span>
        </div>
        <div className="mt-4 flex justify-end gap-3 border-t border-card-border pt-4">
          <Button type="button" variant="outline" className="h-11 px-5 fs-text font-semibold text-primary" onClick={() => { setDraftDate(""); onApply("ALL"); }}>Clear</Button>
          <Button type="button" disabled={!draftDate} className="h-11 px-5 fs-text font-semibold" onClick={() => onApply(`ON:${draftDate}`)}>Apply</Button>
        </div>
      </div>
    </div>
  );
}

function optionsFor(key: DashboardFilterKey, branches: string[], products: string[]): FilterOption[] {
  if (key === "branch") return [{ value: "ALL", label: "All" }, ...branches.map((label) => ({ value: label, label }))];
  if (key === "product") return [{ value: "ALL", label: "All" }, ...products.map((label) => ({ value: label, label }))];
  if (key === "date") return [];
  return staticOptions[key];
}

function FilterPopover({
  filter,
  value,
  options,
  onChange,
}: {
  filter: { key: DashboardFilterKey; label: string };
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [valueOpen, setValueOpen] = useState(false);
  const active = options.find((option) => option.value === value);
  const visibleOptions = options.filter((option) => option.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const isDate = filter.key === "date";

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(next) => { setOpen(next); if (next) { setValueOpen(true); setSearch(""); } }}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={filter.label}
          aria-expanded={open}
          data-testid={`dashboard-filter-${filter.key}`}
          className="h-[54px] justify-between gap-3 rounded-[9px] border-primary px-4 fs-text font-medium text-primary hover:bg-primary-tint hover:text-primary"
        >
          <span>{filter.label}{isDate && value.startsWith("ON:") ? `: ${dateText(value.slice(3))}` : ""}</span>
          <ChevronDown className="size-4" aria-hidden="true" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={7}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className={`z-50 rounded-md border border-card-border bg-surface p-0 text-body shadow-lg outline-none ${isDate ? "w-auto" : "w-[524px] max-w-[calc(100vw-32px)]"}`}
        >
          {isDate ? (
            <DateFilter value={value} onApply={(next) => { onChange(next); setOpen(false); }} />
          ) : (
            <div className="p-7">
              <h3 className="border-b border-card-border pb-4 fs-text font-semibold text-body">{filter.label}</h3>
              <label className="mt-5 block fs-text font-semibold text-body" htmlFor={`condition-${filter.key}`}>Condition</label>
              <select id={`condition-${filter.key}`} defaultValue="IS" className="mt-2 h-[52px] w-full appearance-none rounded-[9px] border border-input bg-surface px-4 fs-text text-body outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                <option value="IS">Is</option>
              </select>
              <label className="mt-5 block fs-text font-semibold text-body" htmlFor={`value-${filter.key}`}>Value</label>
              <button
                id={`value-${filter.key}`}
                type="button"
                aria-expanded={valueOpen}
                onClick={() => setValueOpen((current) => !current)}
                className="mt-2 flex h-[52px] w-full items-center justify-between rounded-[9px] border border-input bg-surface px-4 fs-text text-body hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {active?.label ?? "All"}
                <ChevronDown className="size-4 text-label" />
              </button>
              {valueOpen ? (
                <div className="relative z-10 -mt-px overflow-hidden rounded-b-[9px] border border-input bg-surface shadow-md">
                  <div className="m-2 flex h-[54px] items-center gap-3 rounded-[9px] border border-primary px-3 text-label focus-within:ring-2 focus-within:ring-ring/40">
                    <input aria-label={`Search ${filter.label}`} value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent fs-text text-body outline-none" />
                    <Search className="size-5" aria-hidden="true" />
                  </div>
                  <div role="listbox" aria-label={`${filter.label} options`} className="max-h-[250px] overflow-y-auto p-0">
                    {visibleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={option.value === value}
                        onClick={() => { onChange(option.value); setOpen(false); }}
                        className={`block min-h-[48px] w-full px-4 text-left fs-text transition-colors hover:bg-primary-tint ${option.value === value ? "bg-primary text-white hover:bg-primary" : "text-body"}`}
                      >
                        {option.label}
                      </button>
                    ))}
                    {visibleOptions.length === 0 ? <p className="px-4 py-3 fs-text text-muted-foreground">No options found.</p> : null}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export function DashboardFilterBar({ filters: currentFilters, branches, products, onChange }: DashboardFilterBarProps) {
  return (
    <div
      data-testid="dashboard-filter-bar"
      className="flex min-h-[124px] flex-wrap items-center gap-2.5 rounded-[var(--card-radius)] border border-card-border bg-surface px-[30px] py-5"
    >
      {filters.map((filter) => (
        <FilterPopover
          key={filter.key}
          filter={filter}
          value={currentFilters[filter.key]}
          options={optionsFor(filter.key, branches, products)}
          onChange={(value) => onChange(filter.key, value)}
        />
      ))}
    </div>
  );
}
