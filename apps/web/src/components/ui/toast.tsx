"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  pushToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, variant }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed right-4 top-[calc(var(--header-height)+12px)] z-[90] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={
              "rounded-[var(--card-radius)] border px-4 py-3 text-fs shadow-lg " +
              (item.variant === "error"
                ? "border-accent-red/30 bg-accent-red-bg text-accent-red"
                : item.variant === "info"
                  ? "border-card-border bg-surface text-strong"
                  : "border-accent-teal/30 bg-accent-teal-bg text-brand")
            }
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
