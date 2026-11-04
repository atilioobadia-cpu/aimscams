"use client";

import { useEffect, useState } from "react";
import { FileText, Search } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { MessageServiceShell } from "@/components/messages/message-service-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { MessageAdditionalFilters, type MessageFilterOption } from "@/components/messages/message-additional-filters";
import { ApiError } from "@/lib/api";
import { titleCase } from "@/lib/privacy";
import { createMessageTemplate, listMessageTemplates, type MessageTemplate, type MessageTemplateList } from "@/lib/messages";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load templates.";
}

const TEMPLATE_FILTER_OPTIONS: MessageFilterOption[] = [
  { id: "date", label: "Date", placeholder: "Date", type: "date" },
  { id: "templateKey", label: "Template Key", placeholder: "Template Key" },
];

export function MessageTemplatesPage() {
  const [data, setData] = useState<MessageTemplateList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("All types");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [additionalFilterValues, setAdditionalFilterValues] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState("SMS");
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listMessageTemplates()
        .then((next) => {
          if (cancelled) return;
          setData(next);
          setForbidden(false);
        })
        .catch((failure: unknown) => {
          if (cancelled) return;
          if (failure instanceof ApiError && failure.status === 403) {
            setForbidden(true);
            setData(null);
          } else {
            setError(failureMessage(failure));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reloadKey]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await createMessageTemplate({ key, name, channel, body });
      setKey("");
      setName("");
      setBody("");
      setCreateOpen(false);
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setCreateError(failureMessage(failure));
    } finally {
      setCreating(false);
    }
  }

  const items = (data?.items ?? []).filter((item) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || item.name.toLowerCase().includes(q) || item.key.toLowerCase().includes(q);
    const matchesChannel = channelFilter === "All types" || item.channel.toLowerCase() === channelFilter.toLowerCase();
    const matchesTemplateKey = !selectedFilters.includes("templateKey") || !additionalFilterValues.templateKey || item.key.toLowerCase().includes(additionalFilterValues.templateKey.trim().toLowerCase());
    const matchesDate = !selectedFilters.includes("date") || !additionalFilterValues.date || item.updatedAt.slice(0, 10) === additionalFilterValues.date;
    return matchesQuery && matchesChannel && matchesTemplateKey && matchesDate;
  });

  if (forbidden) {
    return <MessageServiceShell activeTab="Messages"><ForbiddenPanel message="Your role cannot view templates. Ask an administrator for Message : View." /></MessageServiceShell>;
  }

  return (
    <MessageServiceShell activeTab="Messages">
      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section aria-label="Messages" className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="flex min-h-[64px] flex-wrap items-center gap-2 border-b border-card-border p-3">
          <label className="sr-only" htmlFor="template-name-filter">Name</label>
          <div className="relative w-[73px] max-w-[73px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="template-name-filter" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name" className="h-[34px] !rounded-[6px] !border-primary pl-9" />
          </div>
          <label className="sr-only" htmlFor="template-type-filter">Type</label>
          <select id="template-type-filter" value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)} style={{ width: 67 }} className="h-[34px] rounded-[6px] !border-primary bg-background px-2 fs-text font-medium text-primary">
            <option value="All types">Type</option><option value="SMS">SMS</option><option value="Email">Email</option>
          </select>
          <MessageAdditionalFilters
            options={TEMPLATE_FILTER_OPTIONS}
            selected={selectedFilters}
            values={additionalFilterValues}
            onSelectedChange={setSelectedFilters}
            onValueChange={(id, value) => setAdditionalFilterValues((current) => ({ ...current, [id]: value }))}
          />
        </div>
        {loading ? <div className="p-4"><PanelSkeleton rows={5} /></div> : null}
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Message Template" size="large" unsaved={Boolean(name || key || body)}>
        <form className="space-y-3" onSubmit={handleCreate}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="tpl-key">Key</label>
              <Input id="tpl-key" value={key} onChange={(event) => setKey(event.target.value)} placeholder="WELCOME" className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="tpl-name">Name</label>
              <Input id="tpl-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Welcome message" className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="tpl-channel">Channel</label>
              <select id="tpl-channel" value={channel} onChange={(event) => setChannel(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text">
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="tpl-body">Body</label>
              <Input id="tpl-body" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Message body" className="h-[var(--control-height)]" required />
            </div>
          </div>
          {createError ? <p className="fs-text text-accent-red" role="alert">{createError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={creating || !key || !name || !body}>{creating ? "Saving..." : "Create Template"}</Button>
          </div>
        </form>
        </Modal>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Name</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Type</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Date</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Template Key</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Enable / Disable</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Costing</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Template Version</th>
                  <th scope="col" className="px-3 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {!loading && items.length === 0 ? <tr><td colSpan={8} className="h-[212px] px-4 text-center text-muted-foreground"><div className="flex flex-col items-center gap-4"><FileText className="size-12" aria-hidden="true" /><span>No data available</span></div></td></tr> : null}
                {!loading ? items.map((item: MessageTemplate) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.channel}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(item.updatedAt).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.key}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{titleCase(item.status)}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">Unavailable</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">—</td>
                    <td className="whitespace-nowrap px-3 py-3 text-body">—</td>
                  </tr>
                )) : null}
              </tbody>
          </table>
        </div>
      </section>
    </MessageServiceShell>
  );
}
