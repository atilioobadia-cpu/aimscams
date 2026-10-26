import type { ReactNode } from "react";

import { AimscamsMark } from "@/components/brand/aimscams-mark";

export function WakandiLoginShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="min-h-screen bg-white font-[family-name:var(--font-roboto)]"
      style={{ fontFamily: "var(--font-roboto), Roboto, sans-serif", zoom: 0.75 }}
    >
      <div className="flex justify-center px-4 pt-[116px]">
        <div className="relative w-[645px] h-[460px] max-md:w-[calc(100vw-32px)] max-md:h-auto rounded-[12px] bg-[#63a094]">
          <div className="absolute left-1/2 top-[45px] -translate-x-1/2 max-md:static max-md:translate-x-0 max-md:flex max-md:justify-center max-md:pt-[45px]">
            <AimscamsMark className="h-[95px] w-auto text-white max-md:h-[76px]" />
          </div>
          <h1 className="absolute left-1/2 top-[170px] -translate-x-1/2 text-[34px] font-bold leading-none text-white max-md:static max-md:translate-x-0 max-md:text-center max-md:pt-4">
            Login
          </h1>

          <div className="absolute left-1/2 top-[280px] w-[600px] -translate-x-1/2 rounded-[8px] bg-white px-[23px] pt-[30px] pb-[45px] shadow-[0_2px_8px_rgba(0,0,0,0.15)] max-md:static max-md:translate-x-0 max-md:mt-6 max-md:w-[calc(100vw-32px)] max-md:mx-auto">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
