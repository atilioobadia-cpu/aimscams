"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type MessageFilterOption = {
  id: string;
  label: string;
  placeholder: string;
  type?: "text" | "date";
};

type MessageAdditionalFiltersProps = {
  options: MessageFilterOption[];
  selected: string[];
  values: Record<string, string>;
  onSelectedChange: (selected: string[]) => void;
  onValueChange: (id: string, value: string) => void;
};

export function MessageAdditionalFilters({
  options,
  selected,
  values,
  onSelectedChange,
  onValueChange,
}: MessageAdditionalFiltersProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const visibleOptions = options.filter((option) => option.label.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div ref={rootRef} className="message-additional-filters">
      <Button
        type="button"
        variant="outline"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="h-[32.125px] w-[132.104px] gap-2 !rounded-[6px] !border-primary px-3 text-primary hover:bg-primary/5 hover:text-primary"
      >
        <SlidersHorizontal aria-hidden="true" />Add Filters
        <ChevronDown className={open ? "size-4 rotate-180 transition-transform" : "size-4 transition-transform"} aria-hidden="true" />
      </Button>
      {open ? (
        <div role="dialog" aria-label="Available message filters" className="message-filter-options">
          <label className="sr-only" htmlFor="message-filter-search">Search filters</label>
          <div className="relative shrink-0">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="message-filter-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="h-[30px] !rounded-[4px] !border-[#ced4da] pl-7 text-[12px]"
            />
          </div>
          <div role="listbox" aria-label="Option List" aria-multiselectable="true" className="message-filter-option-list">
            {visibleOptions.map((option) => {
              const checked = selected.includes(option.id);
              return (
                <label key={option.id} className="message-filter-option">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onSelectedChange(checked ? selected.filter((id) => id !== option.id) : [...selected, option.id])}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
            {visibleOptions.length === 0 ? <p className="px-2 py-2 text-[12px] text-muted-foreground">No filters found</p> : null}
          </div>
        </div>
      ) : null}
      {selected.map((id) => {
        const option = options.find((candidate) => candidate.id === id);
        if (!option) return null;
        return (
          <div key={id} className="message-filter-value">
            <label className="sr-only" htmlFor={`message-filter-${id}`}>{option.label}</label>
            <Input
              id={`message-filter-${id}`}
              type={option.type ?? "text"}
              value={values[id] ?? ""}
              onChange={(event) => onValueChange(id, event.target.value)}
              placeholder={option.placeholder}
              className="h-[34px] w-[160px] !rounded-[6px] !border-primary"
            />
            <button type="button" aria-label={`Remove ${option.label} filter`} onClick={() => onSelectedChange(selected.filter((field) => field !== id))}>
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
