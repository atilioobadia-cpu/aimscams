import type { ReactNode } from "react";
import { Building2, ShieldCheck, Landmark } from "lucide-react";

import { AimscamsMark } from "@/components/brand/aimscams-mark";
import { TanzaniaFlag } from "@/components/brand/tanzania-flag";

const ACCESS_POINTS = [
  {
    icon: Building2,
    title: "Branch-scoped access",
    body: "People see the branches and records their role allows.",
  },
  {
    icon: ShieldCheck,
    title: "Every action audited",
    body: "Sign-ins, approvals and changes leave a trace.",
  },
  {
    icon: Landmark,
    title: "Made for Tanzania",
    body: "TCDC SACCOS, BoT microfinance and commercial lenders.",
  },
] as const;

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-page lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section
        aria-label="About AIMSCAMS"
        className="relative hidden overflow-hidden border-r border-chrome bg-surface px-12 py-11 lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-14"
      >
        <AimscamsMark className="pointer-events-none absolute -bottom-24 -right-24 size-[460px] text-accent-teal-bg xl:size-[560px]" />

        <div className="relative">
          <div className="flex items-center gap-3.5">
            <span className="grid size-14 place-items-center rounded-xl bg-brand text-on-primary">
              <AimscamsMark className="size-8" />
            </span>
            <div>
              <p className="text-[23px] font-bold leading-none tracking-[-0.02em] text-strong">
                AIMSCAMS
              </p>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.15em] text-label">
                Alpha Integrated Management System
              </p>
            </div>
          </div>
        </div>

        <div className="relative max-w-[470px] py-10">
          <span className="block h-1 w-14 rounded-full bg-brand" aria-hidden="true" />
          <p className="mt-6 text-[39px] font-bold leading-[1.11] tracking-[-0.03em] text-strong xl:text-[45px]">
            One back office for every member, loan and ledger entry.
          </p>
          <p className="mt-5 max-w-[430px] text-[16px] leading-7 text-body">
            AIMSCAMS keeps branch operations, accounting and regulatory reporting on the
            same book of record.
          </p>

          <ul className="mt-8 space-y-4">
            {ACCESS_POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-accent-teal-bg text-brand">
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold leading-5 text-strong">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-chrome pt-5 text-[12px] text-label">
          <span className="flex items-center gap-2 font-medium text-body">
            <TanzaniaFlag />
            Built for Tanzania
          </span>
          <span aria-hidden="true" className="text-chrome">
            /
          </span>
          <span>Synthetic demonstration environment</span>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:min-h-0 lg:px-12">
        <div className="w-full max-w-[472px]">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <span className="grid size-12 place-items-center rounded-xl bg-brand text-on-primary">
              <AimscamsMark className="size-7" />
            </span>
            <div>
              <p className="text-[20px] font-bold leading-none tracking-[-0.02em] text-strong">
                AIMSCAMS
              </p>
              <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-label">
                SACCO operations
              </p>
            </div>
          </div>

          {children}

          <p className="mt-6 flex items-center justify-center gap-2 text-center text-[12px] leading-5 text-label">
            <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
            Access is protected by role-based permissions and audit logging.
          </p>
        </div>
      </section>
    </main>
  );
}
