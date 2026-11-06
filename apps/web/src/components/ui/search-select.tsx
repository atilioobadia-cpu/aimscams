"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

import { Input } from "@/components/ui/input";

export type SearchOption = { id: string; label: string };

export function SearchSelect({
  id,
  options,
  value,
  disabled = false,
  required = false,
  invalid = false,
  allowCustom = false,
  clearable = false,
  placeholder = "Search...",
  onValueChange,
}: {
  id: string;
  options: SearchOption[];
  value: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  allowCustom?: boolean;
  clearable?: boolean;
  placeholder?: string;
  onValueChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value);
  const currentLabel = selected?.label ?? (allowCustom ? value : "");
  const filteredOptions = options.filter((option) => option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const customValue = query.trim();
  const showCustomOption = Boolean(allowCustom && customValue && !filteredOptions.some((option) => option.label.toLocaleLowerCase() === customValue.toLocaleLowerCase()));

  return (
    <div className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-required={required}
        aria-invalid={invalid || undefined}
        aria-controls={`${id}-options`}
        disabled={disabled}
        onClick={() => { setQuery(""); setOpen((current) => !current); }}
        className={`flex h-[var(--control-height)] w-full items-center justify-between rounded-[var(--control-radius)] border ${invalid ? "border-destructive" : "border-input"} bg-background px-3 text-left fs-text text-body disabled:cursor-not-allowed disabled:opacity-60 ${clearable ? "pr-16" : "pr-9"}`}
      >
        <span className={currentLabel ? "truncate" : "truncate text-muted-foreground"}>{currentLabel || (disabled ? "Loading..." : placeholder)}</span>
      </button>
      {clearable && value ? (
        <button
          type="button"
          aria-label={`Clear ${placeholder.toLocaleLowerCase()}`}
          onClick={() => onValueChange("")}
          className="absolute right-8 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-body"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      {open && !disabled ? (
        <div className="absolute z-50 mt-1 w-full rounded-[var(--card-radius)] border border-card-border bg-surface p-2 shadow-lg">
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search..."
            aria-label={`Search ${placeholder.toLocaleLowerCase()}`}
            autoComplete="off"
            className="mb-1 h-[var(--control-height)] w-full"
          />
          <div id={`${id}-options`} role="listbox" className="max-h-56 overflow-y-auto">
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={value === option.id}
                onClick={() => { onValueChange(option.id); setOpen(false); setQuery(""); }}
                className="block min-h-9 w-full rounded px-2 text-left fs-text text-body hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none"
              >
                {option.label}
              </button>
            ))}
            {showCustomOption ? (
              <button
                type="button"
                role="option"
                aria-selected={value === customValue}
                onClick={() => { onValueChange(customValue); setOpen(false); setQuery(""); }}
                className="block min-h-9 w-full rounded px-2 text-left fs-text text-body hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none"
              >
                {customValue}
              </button>
            ) : null}
            {filteredOptions.length === 0 && !showCustomOption ? <p className="px-2 py-2 fs-text text-muted-foreground">No options</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
