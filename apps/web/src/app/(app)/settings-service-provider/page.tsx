import type { Metadata } from "next";
import { LayoutGrid } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";

export const metadata: Metadata = { title: "Services · AIMSCAMS" };

export default function ServiceProvidersPage() {
  return (
    <div className="space-y-[18px]">
      <PageHeader
        variant="card"
        className="min-h-[94px]"
        icon={
          <span className="ml-[2px] mr-[4px] grid size-[42px] shrink-0 place-items-center rounded-[12px] border border-primary/25 bg-primary-tint">
            <LayoutGrid className="size-5 text-primary" aria-hidden="true" />
          </span>
        }
        title="Services"
      />
    </div>
  );
}
