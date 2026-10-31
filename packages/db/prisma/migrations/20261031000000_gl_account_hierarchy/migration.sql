-- The Prisma migration stream created gl_account without the hierarchy columns
-- that packages/ledger/src/schema.sql defines and the accounting API reads.
-- Add them so the chart of accounts renders from real data.

alter table gl_account
  add column if not exists is_group boolean not null default false,
  add column if not exists parent_id uuid,
  add column if not exists opening_balance_minor bigint not null default 0;

alter table gl_account
  add constraint gl_account_parent_fkey
  foreign key (parent_id, organisation_id)
  references gl_account (id, organisation_id);

create index if not exists gl_account_parent_idx
  on gl_account (organisation_id, parent_id);
