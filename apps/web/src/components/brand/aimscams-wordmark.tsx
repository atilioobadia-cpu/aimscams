import { cn } from "cn";

/**
 * AIMSCAMS product wordmark for the auth screens. The product name is the
 * lockup; no monogram is used here.
 */
export function AimscamsWordmark({ className }: { className?: string }) {
  return (
    <span
      aria-label="AIMSCAMS"
      className={cn("inline-flex flex-col items-center text-white", className)}
    >
      <span
        aria-hidden="true"
        className="text-[29px] font-bold leading-none tracking-[0.16em]"
      >
        AIMSCAMS
      </span>
      <span aria-hidden="true" className="mt-2.5 h-[2px] w-12 rounded-full bg-white/65" />
    </span>
  );
}
