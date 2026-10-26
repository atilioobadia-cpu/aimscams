import { cn } from "cn";

/** Tanzanian flag, drawn from the official green/yellow/black/blue geometry. */
export function TanzaniaFlag({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Tanzania"
      data-testid="tanzania-flag"
      className={cn("inline-flex h-5 w-8 shrink-0 overflow-hidden rounded-[2px]", className)}
    >
      <svg viewBox="0 0 38 24" className="size-full" aria-hidden="true">
        <rect width="38" height="24" className="fill-flag-green" />
        <path d="M0 24 38 0v24H0Z" className="fill-flag-blue" />
        <path d="M0 24 38 0h-7L0 18.2V24Z" className="fill-flag-yellow" />
        <path d="M0 24 38 0h-4L0 21.2V24Z" className="fill-flag-black" />
      </svg>
    </span>
  );
}
