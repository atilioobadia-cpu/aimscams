import { CircleAlert } from "lucide-react";

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex gap-2.5 rounded-lg border border-accent-red/20 bg-accent-red-bg px-3.5 py-3 text-[var(--fs)] leading-5 text-accent-red"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

