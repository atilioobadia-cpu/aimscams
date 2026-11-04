import type { Metadata } from "next";
import { Inbox, Megaphone } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";

export const metadata: Metadata = {
  title: "Campaigns · AIMSCAMS",
};

export default function CampaignsPage() {
  return (
    <div className="space-y-3.5">
      <PageHeader
        variant="card"
        title="Campaigns"
        icon={<Megaphone className="size-5 text-primary" aria-hidden="true" />}
        className="!min-h-[66px] !px-5 !py-3"
      />

      <section aria-labelledby="recommended-campaigns-heading" className="flex min-h-[264px] flex-col rounded-[8px] border border-card-border bg-card px-[20.16px] py-[20.16px]">
        <div>
          <h2 id="recommended-campaigns-heading" className="text-[15.456px] font-semibold leading-[1.2] text-heading">Recommended campaigns</h2>
          <p className="mt-px text-[11.76px] leading-[1.2] text-muted-foreground">Marketing campaigns published by Wakandi ops that you can launch for your cooperative.</p>
        </div>
        <div className="mt-[10px] flex flex-1 flex-col items-center justify-center gap-[10.08px] py-[33.6px] text-center">
          <Inbox className="size-[34px] shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />
          <h3 className="text-[14.784px] font-semibold leading-[1.2] text-heading">No campaigns available</h3>
          <p className="max-w-[376px] text-[12.768px] leading-[1.4] text-muted-foreground">There are no published campaigns for your cooperative yet. Check back later or contact ops.</p>
        </div>
      </section>
    </div>
  );
}
