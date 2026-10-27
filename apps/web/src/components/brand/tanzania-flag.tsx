import { cn } from "cn";

export function TanzaniaFlag({ className }: { className?: string }) {
  return (
    <svg
      width="23"
      height="15"
      viewBox="0 0 30 20"
      role="img"
      aria-label="Tanzania"
      className={cn("shrink-0 rounded-[2px]", className)}
      style={{ display: "block" }}
      data-testid="tanzania-flag"
    >
      <rect width="30" height="20" fill="#00A3DD" />
      <path d="M0 0H30L0 20Z" fill="#1EB53A" />
      <path d="M-2 21.33L32 -1.33" stroke="#FCD116" strokeWidth="8" />
      <path d="M-2 21.33L32 -1.33" stroke="#000" strokeWidth="5.4" />
    </svg>
  );
}
