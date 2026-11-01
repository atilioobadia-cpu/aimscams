"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DashboardFilterKey = "branch" | "gender" | "age" | "clientType" | "product" | "date";
export type DashboardFilters = Record<DashboardFilterKey, string>;

type DashboardFilterBarProps = {
  filters: DashboardFilters;
  branches: string[];
  products: string[];
  onChange: (key: DashboardFilterKey, value: string) => void;
};

const staticOptions: Record<Exclude<DashboardFilterKey, "branch" | "product">, Array<[string, string]>> = {
  gender: [
    ["ALL", "All genders"],
    ["FEMALE", "Female"],
    ["MALE", "Male"],
    ["UNDEFINED", "Not defined"],
  ],
  age: [
    ["ALL", "All ages"],
    ["UNDER_18", "Under 18"],
    ["18_35", "18–35"],
    ["36_60", "36–60"],
    ["OVER_60", "Over 60"],
  ],
  clientType: [
    ["ALL", "All client types"],
    ["INDIVIDUAL", "Individual"],
    ["GROUP", "Group"],
  ],
  date: [
    ["ALL", "All time"],
    ["THIS_MONTH", "This month"],
    ["LAST_90_DAYS", "Last 90 days"],
    ["THIS_YEAR", "This year"],
  ],
};

const labels: Array<[DashboardFilterKey, string]> = [
  ["branch", "Branch"],
  ["gender", "Gender"],
  ["age", "Age"],
  ["clientType", "Client Type"],
  ["product", "Product"],
  ["date", "Date"],
];

function optionsFor(
  key: DashboardFilterKey,
  branches: string[],
  products: string[],
): Array<[string, string]> {
  if (key === "branch") return [["ALL", "All branches"], ...branches.map((name) => [name, name] as [string, string])];
  if (key === "product") return [["ALL", "All products"], ...products.map((name) => [name, name] as [string, string])];
  return staticOptions[key];
}

export function DashboardFilterBar({ filters, branches, products, onChange }: DashboardFilterBarProps) {
  return (
    <div
      data-testid="dashboard-filter-bar"
      className="flex min-h-[72px] flex-wrap items-center gap-2 rounded-[var(--card-radius)] border border-card-border bg-surface px-5 py-3"
    >
      {labels.map(([key, label]) => (
        <DropdownMenu key={key}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              data-testid={`dashboard-filter-${key}`}
              className="h-9 justify-between gap-3 rounded-[5px] border-primary px-3 fs-text font-normal text-primary hover:bg-primary-tint hover:text-primary"
            >
              {label}
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[152px]">
            <DropdownMenuRadioGroup
              value={filters[key]}
              onValueChange={(value) => onChange(key, value)}
            >
              {optionsFor(key, branches, products).map(([value, optionLabel]) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  {optionLabel}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
}
