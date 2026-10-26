import type { ReactNode } from "react";

import { AimscamsMark } from "@/components/brand/aimscams-mark";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-6">
      <div className="w-full max-w-[600px]">
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-lg bg-brand text-on-primary">
            <AimscamsMark className="size-6" />
          </span>
          <p className="text-[18px] font-bold leading-none tracking-[-0.02em] text-strong">
            AIMSCAMS
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
