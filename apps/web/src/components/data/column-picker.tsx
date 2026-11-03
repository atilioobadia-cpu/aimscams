"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

export type ColumnOption<K extends string> = {
  key: K;
  label: string;
};

type ColumnPickerProps<K extends string> = {
  columns: ColumnOption<K>[];
  visible: Record<K, boolean>;
  onToggle: (key: K, checked: boolean) => void;
  onReset: () => void;
};

export function ColumnPicker<K extends string>({ columns, visible, onToggle, onReset }: ColumnPickerProps<K>) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Column settings"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex h-[15px] w-[37px] items-center justify-center rounded-[6px] border-0 bg-transparent text-[#495057] hover:bg-[#f1f5f9]"
      >
        <SlidersHorizontal className="size-[14px]" aria-hidden="true" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close columns panel"
            className="absolute inset-0 h-full w-full cursor-default border-0 bg-black/25"
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Columns"
            className="absolute inset-y-0 right-0 flex w-[269px] max-w-[90vw] flex-col border-l border-[#e2e8f0] bg-white text-[#495057] shadow-xl"
          >
            <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#e2e8f0] px-[20px]">
              <h2 className="text-[11.16px] font-bold leading-none">Columns</h2>
              <button
                type="button"
                aria-label="Close columns panel"
                onClick={() => setOpen(false)}
                className="inline-flex h-[32px] w-[42px] items-center justify-center rounded-[6px] border border-[#057573] bg-[#057573] text-white hover:bg-[#046765]"
              >
                <X className="size-[14px]" aria-hidden="true" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-[20px] pb-[20px] pt-0">
              {columns.map(({ key, label }) => (
                <label key={key} className="flex min-h-[36px] cursor-pointer items-center gap-[10px] text-[13.44px] font-normal hover:bg-[#f8fafc]">
                  <input
                    type="checkbox"
                    checked={visible[key]}
                    onChange={(event) => onToggle(key, event.target.checked)}
                    className="size-[20px] shrink-0 accent-[#057573]"
                  />
                  {label}
                </label>
              ))}
            </div>
            <footer className="flex shrink-0 justify-end gap-[8px] border-t border-[#e2e8f0] p-[20px]">
              <button type="button" onClick={onReset} className="h-[34px] rounded-[6px] border border-[#057573] bg-white px-[13px] text-[13.44px] font-medium text-[#057573] hover:bg-[#f8fafc]">Reset</button>
              <button type="button" onClick={() => setOpen(false)} className="h-[34px] rounded-[6px] border border-[#057573] bg-[#057573] px-[13px] text-[13.44px] font-medium text-white hover:bg-[#046765]">Save</button>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
