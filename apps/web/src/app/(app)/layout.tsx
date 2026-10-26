import type { ReactNode } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { dashboardFixture } from "@/lib/fixtures/dashboard";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      institution={dashboardFixture.institution}
      branch={dashboardFixture.branch}
      user={dashboardFixture.user}
    >
      {children}
    </AppShell>
  );
}
