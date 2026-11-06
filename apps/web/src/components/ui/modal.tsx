"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "default" | "large" | "wide" | "extra-wide";
  unsaved?: boolean;
};

export function Modal({ open, onClose, title, children, footer, size = "default", unsaved = false }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

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

  const modal = (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-3 transition-opacity duration-150 sm:p-6",
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
          "relative z-10 flex max-h-[calc(100dvh-1.5rem)] min-w-0 flex-col overflow-hidden rounded-[11px] bg-surface shadow-xl transition-transform duration-150 sm:max-h-[calc(100dvh-3rem)]",
          open ? "scale-100" : "scale-95",
          size === "extra-wide" ? "w-full sm:w-[1280px] sm:max-w-[92vw]" : size === "wide" ? "w-full sm:w-[1080px] sm:max-w-[92vw]" : size === "large" ? "w-full sm:w-[900px] sm:max-w-[92vw]" : "w-full sm:w-[643px] sm:max-w-[92vw]",
        )}
      >
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-chrome px-4 py-3 sm:px-5">
          <h2 id="modal-title" className="min-w-0 break-words fs-text font-bold text-strong">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:text-strong focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-chrome px-4 py-3 sm:gap-4 sm:px-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
  return portalTarget ? createPortal(modal, portalTarget) : modal;
}
