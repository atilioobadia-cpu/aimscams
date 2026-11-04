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
        className="min-h-[59px] px-5 py-0"
        icon={<BarChart3 className="size-5 text-primary" aria-hidden="true" />}
      />
      <div className="grid grid-cols-1 gap-[13.44px] md:grid-cols-2 lg:grid-cols-4">
        {reports.map((report) => (
          <article
            key={report.href}
            className="group relative min-h-[63.84px] rounded-[var(--card-radius)] border border-card-border bg-surface shadow-sm transition-colors hover:border-primary"
          >
            <Link
              href={report.href}
              className="flex min-h-[63.84px] items-center rounded-[var(--card-radius)] px-[13.44px] py-3 pr-[60px] focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <h2 className="fs-text font-semibold text-strong">{report.title}</h2>
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
