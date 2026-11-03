"use client";

import { Fragment, useState } from "react";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";

export type RegulatorySection = { title: string; rows: string[] };

export function RegulatorySchedulePage({
  title,
  period = "month",
  sections,
  measures = ["Current Period", "Previous Period"],
}: {
  title: string;
  period?: "month" | "quarter";
  sections: RegulatorySection[];
  measures?: string[];
}) {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [periodValue, setPeriodValue] = useState(period === "quarter" ? "Q1" : "1");
  const [submitted, setSubmitted] = useState(false);

  function clear() {
    setYear(String(new Date().getFullYear()));
    setPeriodValue(period === "quarter" ? "Q1" : "1");
    setSubmitted(false);
  }

  return (
    <div className="space-y-4">
      <PageHeader variant="card" title={title} actions={(
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled title="Saved reports are unavailable without the local regulatory reports service">Saved Reports</Button>
          <Button type="button" disabled title="Saving is unavailable without the local regulatory reports service">Save</Button>
        </div>
      )} />

      <section aria-label={`${title} reporting period`} className="rounded-[var(--card-radius)] border border-card-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 fs-text text-label">Year
            <select value={year} onChange={(event) => setYear(event.target.value)} className="h-[42px] min-w-32 rounded-[var(--control-radius)] border border-card-border bg-background px-3 text-body">
              {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid gap-1 fs-text text-label">{period === "quarter" ? "Quarter" : "Month"}
            <select value={periodValue} onChange={(event) => setPeriodValue(event.target.value)} className="h-[42px] min-w-36 rounded-[var(--control-radius)] border border-card-border bg-background px-3 text-body">
              {period === "quarter" ? ["Q1", "Q2", "Q3", "Q4"].map((item) => <option key={item}>{item}</option>) : Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={String(index + 1)}>{new Date(2000, index).toLocaleString("en", { month: "long" })}</option>)}
            </select>
          </label>
          <Button type="button" onClick={() => setSubmitted(true)} className="h-[42px] px-4">Submit</Button>
          <Button type="button" variant="outline" onClick={clear} className="h-[42px] border-primary px-4 text-primary hover:bg-primary/5 hover:text-primary">Clear</Button>
        </div>
        {submitted ? <p role="status" className="mt-3 fs-text text-muted-foreground">Report data is unavailable because no local regulatory report source is configured.</p> : null}
      </section>

      <section aria-label={`${title} schedule`} className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse fs-text text-body">
            <thead className="bg-subtle text-label">
              <tr><th scope="col" className="min-w-80 border border-card-border px-4 py-3 text-left">Particulars</th>{measures.map((measure) => <th key={measure} scope="col" className="min-w-48 border border-card-border px-4 py-3 text-right">{measure}</th>)}</tr>
            </thead>
            <tbody>{sections.map((section) => <Fragment key={section.title}>
              <tr className="bg-subtle font-semibold"><th colSpan={measures.length + 1} scope="colgroup" className="border border-card-border px-4 py-3 text-left">{section.title}</th></tr>
              {section.rows.map((row) => <tr key={`${section.title}-${row}`}><th scope="row" className="border border-card-border px-4 py-3 text-left font-normal">{row}</th>{measures.map((measure) => <td key={measure} className="border border-card-border px-4 py-3 text-right text-muted-foreground">—</td>)}</tr>)}
            </Fragment>)}</tbody>
          </table>
        </div>
      </section>
      <p className="fs-small text-muted-foreground">Values are blank until AIMSCAMS has an authorized regulatory report data source.</p>
    </div>
  );
}
