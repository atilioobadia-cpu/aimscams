-- Ledger operator surface.
--
-- Two tables that must commit with the book:
--
--   accounting_setting  per-tenant configuration that has no home in the chart
--                       of accounts (tax rate, inter-branch posting);
--   outbox_event        the transactional outbox. A journal entry and its event
--                       are written in one transaction, so a crash between
--                       commit and publish loses nothing.
--
-- Both are tenant-scoped and forced under row-level security, like the rest of
-- the ledger.

create table accounting_setting (
  organisation_id      uuid primary key references organisation (id),
  tax_rate_bp          integer not null default 0 check (tax_rate_bp between 0 and 10000),
  inter_branch_enabled boolean not null default false,
  updated_at           timestamptz not null default now()
);

create table outbox_event (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisation (id),
  event_type      text not null,
  aggregate_type  text not null,
  aggregate_id    uuid,
  payload         jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  status          text not null default 'pending'
                  check (status in ('pending', 'processing', 'processed', 'dead')),
  attempts        integer not null default 0 check (attempts >= 0),
  last_error      text,
  available_at    timestamptz not null default now(),
  processed_at    timestamptz,
  created_at      timestamptz not null default now(),

  check ((status = 'processed') = (processed_at is not null)),
  unique (organisation_id, idempotency_key)
);

create index outbox_event_pending_idx
  on outbox_event (organisation_id, available_at)
  where status = 'pending';

insert into accounting_setting (organisation_id)
select id from organisation
on conflict (organisation_id) do nothing;

alter table accounting_setting enable row level security;
alter table outbox_event       enable row level security;

alter table accounting_setting force row level security;
alter table outbox_event       force row level security;

create policy tenant_isolation on accounting_setting
  using (organisation_id = current_tenant_id())
  with check (organisation_id = current_tenant_id());

create policy tenant_isolation on outbox_event
  using (organisation_id = current_tenant_id())
  with check (organisation_id = current_tenant_id());
