import type { ReactNode } from "react";

import { AimscamsMark } from "@/components/brand/aimscams-mark";

export function AuthShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-8 font-[family-name:var(--font-roboto)]">
      <div className="w-full max-w-[420px]">
        <div className="h-[190px] rounded-[10px] bg-[#63a094] pt-6">
          <div className="flex justify-center">
            <AimscamsMark className="h-10 w-auto text-white" />
          </div>
          <h1 className="mx-auto mt-4 w-full px-5 text-center text-[20px] font-semibold leading-6 text-white">
            {title}
          </h1>
        </div>
        <div className="relative z-10 mx-auto -mt-10 w-full max-w-[380px]">
          {children}
        </div>
      </div>
    </main>
  );
}
