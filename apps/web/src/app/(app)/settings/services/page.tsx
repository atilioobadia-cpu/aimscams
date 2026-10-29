import type { Metadata } from "next";

import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Construction } from "lucide-react";

export const metadata: Metadata = {
  title: "Services · AIMSCAMS",
};

export default function ServicesSettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Services"
        description="Value-added services offered to clients."
        breadcrumb="Settings"
      />
      <EmptyState
        icon={Construction}
        title="Services catalogue"
        description="Service catalogue, pricing and eligibility will be configured here once the client and accounts modules are complete."
      />
    </div>
  );
}
