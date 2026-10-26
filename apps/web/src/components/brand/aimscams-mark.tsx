import { cn } from "cn";

/** AIMSCAMS mark: a hard-edged "A" cut from a chevron, not a copied logo. */
export function AimscamsMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn("size-8", className)}>
      <path
        d="M16 3.2 30.2 28.8h-8.1l-2.35-4.9h-7.5l-2.35 4.9H1.8L16 3.2Zm0 10.1-2.55 5.3h5.1L16 13.3Z"
        fill="currentColor"
      />
    </svg>
  );
}
