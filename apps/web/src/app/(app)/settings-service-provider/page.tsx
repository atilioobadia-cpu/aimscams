import type { Metadata } from "next";
import { LayoutGrid } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";

export const metadata: Metadata = { title: "Services · AIMSCAMS" };

export default function ServiceProvidersPage() {
  return (
    <div>
      <PageHeader
        variant="card"
        icon={
          <span
            data-parity="page-icon-tile"
            className="grid size-[33.59px] shrink-0 place-items-center rounded-[10.08px] border-[0.666667px] border-[#aecacd] bg-[#e1eeee] text-primary"
          >
            <LayoutGrid className="size-[14.112px] text-primary" strokeWidth={2} aria-hidden="true" />
          </span>
        }
        title="Services"
      />
    </div>
  );
}
