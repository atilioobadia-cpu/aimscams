import Link from "next/link";
import { BarChart3, Info } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";

type ReportLink = { href: string; title: string; description?: string };

export function ReportCategoryHub({ title, reports }: { title: string; reports: ReportLink[] }) {
  return (
    <div className="space-y-[13.44px]">
      <PageHeader
        variant="card"
        title={title}
        className="report-category-header min-h-[59.594px] !rounded-[8px] !border-[#dee2e6] px-[20.16px] py-0"
        icon={<BarChart3 className="size-[20.16px] text-primary" aria-hidden="true" />}
      />
      <div className="grid grid-cols-1 gap-[13.44px] md:grid-cols-2 lg:grid-cols-4">
        {reports.map((report) => (
          <article
            key={report.href}
            className="report-category-card group relative min-h-[63.833px] bg-surface transition-colors"
          >
            <Link
              href={report.href}
              className="flex min-h-[63.833px] items-center rounded-[8px] px-[13.44px] py-[13.44px] pr-[60px] focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <h2 className="text-[13.44px] font-bold leading-[1.2] text-label">{report.title}</h2>
            </Link>
            <button
              type="button"
              aria-label={`Report description: ${report.title}`}
              title={report.description ?? report.title}
              className="absolute right-[13.44px] top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-label transition-colors hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Info className="size-4" aria-hidden="true" />
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
