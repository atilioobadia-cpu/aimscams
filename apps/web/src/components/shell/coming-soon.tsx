import { Construction } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";

type ComingSoonProps = {
  title: string;
  description: string;
  detail: string;
  actions?: ReactNode;
};

/**
 * Destination that exists in the measured navigation but has no module behind it yet.
 * It renders a real page rather than a dead link, so no menu item 404s.
 */
export function ComingSoon({ title, description, detail, actions }: ComingSoonProps) {
  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <span className="rounded-[6px] bg-primary-tint px-[var(--space-8)] py-[var(--space-4)] fs-text font-semibold text-primary">
              In build
            </span>
            {actions}
          </>
        }
      />
      <EmptyState icon={Construction} title={`${title} is not enabled yet`} description={detail} />
    </div>
  );
}
