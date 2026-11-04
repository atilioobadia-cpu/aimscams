import type { Metadata } from "next";
import Link from "next/link";
import { Play, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";

export const metadata: Metadata = {
  title: "Active Campaigns · AIMSCAMS",
};

export default function ActiveCampaignsPage() {
  return (
    <div className="space-y-3.5">
      <PageHeader
        variant="card"
        title="Active Campaigns"
        icon={<Play className="size-5 text-primary" aria-hidden="true" />}
        className="!min-h-[66px] !px-5 !py-3"
      />

      <section aria-labelledby="running-campaigns-heading" className="flex min-h-[290px] flex-col gap-[13.44px] rounded-[8px] border border-card-border bg-card px-[20.16px] py-[20.16px]">
        <header className="flex h-[34px] items-start justify-between">
          <div className="w-[468px] shrink-0">
            <h2 id="running-campaigns-heading" className="text-[15.456px] font-semibold leading-[1.2] text-heading">Running campaigns</h2>
            <p className="mt-px whitespace-nowrap text-[11.76px] leading-[1.2] text-muted-foreground">Campaigns your cooperative has launched. Click one to view details, analytics, or pause it.</p>
          </div>
          <label className="block w-[200px] shrink-0">
            <span className="sr-only">Campaign status</span>
            <select defaultValue="All statuses" aria-label="Campaign status" className="!h-[34px] w-full !rounded-[6px] !border-[1px] !border-[#ced4da] bg-card px-[10.08px] !text-[13.44px] text-heading">
              <option>All statuses</option>
              <option>Scheduled</option>
              <option>Active</option>
              <option>Paused</option>
              <option>Cancelled</option>
              <option>Completed</option>
            </select>
          </label>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-[10.08px] py-[33.6px] text-center">
          <TriangleAlert className="size-[34px] shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
          <h3 className="text-[14.784px] font-semibold leading-[1.2] text-heading">Couldn&apos;t load running campaigns</h3>
          <p className="text-[12.768px] leading-[1.4] text-muted-foreground">Campaign service isn&apos;t connected in the local environment.</p>
          <Link href="/active-campaigns" role="button" className="inline-flex h-[34px] items-center justify-center rounded-[6px] bg-primary px-3.5 text-[13.44px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">Retry</Link>
        </div>
      </section>
    </div>
  );
}
