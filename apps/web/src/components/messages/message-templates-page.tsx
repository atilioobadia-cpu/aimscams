"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Search } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { titleCase } from "@/lib/privacy";
import { createMessageTemplate, listMessageTemplates, type MessageTemplate, type MessageTemplateList } from "@/lib/messages";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load templates.";
}

export function MessageTemplatesPage() {
  const [data, setData] = useState<MessageTemplateList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState("SMS");
  const [creating, setCreating] = useState(false);
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
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setCreateError(failureMessage(failure));
    } finally {
      setCreating(false);
    }
  }

  const items = (data?.items ?? []).filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || item.key.toLowerCase().includes(q);
  });

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Templates" description="Message templates." />
        <ForbiddenPanel message="Your role cannot view templates. Ask an administrator for Message : View." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Templates" description="Message templates with versioning." breadcrumb="Messages" />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <h2 className="mb-3 fs-text font-bold text-strong">Add template</h2>
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
          <Button type="submit" disabled={creating || !key || !name || !body}>{creating ? "Saving..." : "Add template"}</Button>
        </form>
      </section>

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="tpl-search">Search</label>
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="tpl-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or key" className="h-[var(--control-height)] pl-9" />
            </div>
          </div>
        </div>
        {loading ? (
          <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
            <PanelSkeleton rows={6} />
          </section>
        ) : items.length === 0 ? (
          <EmptyState icon={FileText} title="No templates yet" description="Add a template to start sending messages." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Key</th>
                  <th className="whitespace-nowrap px-4 py-3">Name</th>
                  <th className="whitespace-nowrap px-4 py-3">Channel</th>
                  <th className="whitespace-nowrap px-4 py-3">Language</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                  <th className="whitespace-nowrap px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: MessageTemplate) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.key}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.channel}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.language}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{titleCase(item.status)}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(item.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
