"use client";

import { useEffect, useState } from "react";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { listDashboard } from "@/lib/settings";
import type { DashboardFixture } from "@/lib/fixtures/dashboard";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardFixture | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listDashboard()
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return <div className="p-[13.44px]">Loading dashboard…</div>;
  }

  return <DashboardView data={data} />;
}