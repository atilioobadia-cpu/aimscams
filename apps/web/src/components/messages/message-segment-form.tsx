"use client";

import { useState } from "react";
import Link from "next/link";
import { ChartPie } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MessageSegmentForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="space-y-4">
      <PageHeader variant="card" title="Create Segment" icon={<ChartPie className="size-6 text-strong" aria-hidden="true" />} />
      <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-4">
        <div className="max-w-[370px] space-y-3">
          <div className="space-y-1">
            <label htmlFor="segment-name" className="block fs-text text-label">Name<span aria-hidden="true">*</span></label>
            <Input
              id="segment-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-required="true"
              className="h-[42px] border-input"
            />
          </div>
        </div>
        <div className="mt-4 max-w-[760px] space-y-1">
          <label htmlFor="segment-description" className="block fs-text text-label">Description</label>
          <textarea
            id="segment-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            style={{ height: 124 }}
            className="h-[124px] w-full resize-y rounded-[var(--control-radius)] border border-input bg-background px-3 py-2 fs-text text-body outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>

        <div className="mt-10 space-y-4">
          <h2 className="fs-section font-bold text-heading">Create Filters</h2>
          <div className="max-w-[370px] space-y-1">
            <label htmlFor="segment-filter" className="block fs-text text-label">Filter</label>
            <select
              id="segment-filter"
              value=""
              disabled
              aria-describedby="segment-filter-note"
              className="h-[42px] w-full rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body disabled:cursor-not-allowed disabled:opacity-100"
            >
              <option value="">Select Filter</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button type="button" disabled title="Saving is unavailable until segment criteria and persistence are implemented." className="bg-muted text-muted-foreground disabled:opacity-100">
            Save
          </Button>
          <Button asChild type="button" variant="outline" className="border-primary text-primary">
            <Link href="/messages-segment-list">Cancel</Link>
          </Button>
        </div>
        <p id="segment-filter-note" className="sr-only">
          Filter fields and saving are unavailable until segment criteria and persistence are implemented.
        </p>
      </section>
    </div>
  );
}
