"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "default" | "large";
  unsaved?: boolean;
};

export function Modal({ open, onClose, title, children, footer, size = "default", unsaved = false }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      document.body.style.overflow = "hidden";
      document.body.dataset.modalOpen = "true";
    } else {
      const timer = setTimeout(() => setVisible(false), 150);
      document.body.style.overflow = "";
      delete document.body.dataset.modalOpen;
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (unsaved) {
          if (confirm("You have unsaved changes. Discard them?")) onClose();
        } else {
          onClose();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, unsaved, onClose]);

  if (!visible && !open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-150",
        open ? "opacity-100" : "opacity-0",
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (unsaved) {
            if (confirm("You have unsaved changes. Discard them?")) onClose();
          } else {
            onClose();
          }
        }
      }}
    >
      <div
        className="absolute inset-0 bg-black/45"
        onClick={() => {
          if (unsaved) {
            if (confirm("You have unsaved changes. Discard them?")) onClose();
          } else {
            onClose();
          }
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative z-10 flex max-h-[90vh] flex-col rounded-[11px] bg-surface shadow-xl transition-transform duration-150",
          open ? "scale-100" : "scale-95",
          size === "large" ? "w-[900px] max-w-[92vw]" : "w-[643px] max-w-[92vw]",
        )}
      >
        <div className="flex items-center justify-between border-b border-chrome px-5 py-3">
          <h2 id="modal-title" className="text-fs font-bold text-strong">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-6 place-items-center rounded text-muted-foreground hover:text-strong focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-4 border-t border-chrome px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
