"use client";

import { TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/data/empty-state";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      icon={TriangleAlert}
      title="The dashboard could not load"
      description="The branch snapshot did not render. Retry the request; if it fails again, check the API and database health before posting."
      action={
        <Button type="button" className="h-11 px-5" onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
