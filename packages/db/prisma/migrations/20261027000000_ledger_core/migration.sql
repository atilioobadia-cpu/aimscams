-- AIMSCAMS ledger core.
--
-- The database, not the application, enforces the rules that must never be
-- broken:
--
--   1. every entry balances ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â checked at commit by a deferred constraint
--      trigger, so an entry and its lines can be written in any order;
--   2. an entry has at least two lines, and every line carries exactly one
--      side: a debit or a credit, never both, never neither;
--   3. a posted entry and its lines can never be updated or deleted;
--   4. an entry can only be written into an open fiscal period, and its date
--      must fall inside that period;
--   5. a line can never reference another organisation's entry or account;
--   6. tenants are isolated by row-level security, forced on the owner too.
--
-- Amounts are integer minor units (TZS x 100). No floats, no numeric, so a
-- shilling can never be lost to rounding between the domain and the book.



create table fiscal_period (
  id         uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisation (id),
  starts_on  date not null,
  ends_on    date not null,
  status     text not null default 'open' check (status in ('open', 'closed')),
  check (ends_on > starts_on),
  unique (organisation_id, starts_on),
  unique (id, organisation_id)
);

create table gl_account (
  id              uuid primary key default gen_random_uuid(),
  organisation_id       uuid not null references organisation (id),
  code            text not null,
  name            text not null,
  type            text not null check (type in ('asset', 'liability', 'equity', 'income', 'expense')),
  normal_balance  text not null check (normal_balance in ('debit', 'credit')),
  is_postable     boolean not null default true,
  is_assumption   boolean not null default false,
  unique (organisation_id, code),
  unique (id, organisation_id)
);

create table posting_policy (
  id             uuid primary key default gen_random_uuid(),
  organisation_id      uuid not null references organisation (id),
  event_code     text not null,
  version        integer not null default 1 check (version > 0),
  lines          jsonb not null,
  is_assumption  boolean not null default false,
  note           text not null default '',
  unique (organisation_id, event_code, version),
  check (jsonb_typeof(lines) = 'array'),
  check (jsonb_array_length(lines) >= 2)
);

create table journal_entry (
  id               uuid primary key default gen_random_uuid(),
  organisation_id        uuid not null references organisation (id),
  entry_no         bigint generated always as identity unique,
  entry_date       date not null,
  period_id        uuid not null,
  event_code       text not null,
  source_type      text not null,
  source_id        text not null,
  description      text not null default '',
  status           text not null default 'draft' check (status in ('draft', 'posted')),
  reversal_of      uuid references journal_entry (id),
  idempotency_key  text,
  posted_at        timestamptz,
  created_at       timestamptz not null default now(),

  check ((status = 'posted') = (posted_at is not null)),
  unique (organisation_id, idempotency_key),
  unique (id, organisation_id),
  foreign key (period_id, organisation_id) references fiscal_period (id, organisation_id)
);

create table journal_line (
  id            uuid primary key default gen_random_uuid(),
  organisation_id     uuid not null references organisation (id),
  entry_id      uuid not null,
  line_no       integer not null check (line_no > 0),
  account_id    uuid not null,
  debit_minor   bigint not null default 0 check (debit_minor >= 0),
  credit_minor  bigint not null default 0 check (credit_minor >= 0),
  memo          text not null default '',

  check ((debit_minor = 0) <> (credit_minor = 0)),
  unique (entry_id, line_no),
  foreign key (entry_id, organisation_id) references journal_entry (id, organisation_id) on delete cascade,
  foreign key (account_id, organisation_id) references gl_account (id, organisation_id)
);

create index journal_entry_tenant_date_idx on journal_entry (organisation_id, entry_date);
create index journal_line_entry_idx on journal_line (entry_id);
create index journal_line_account_idx on journal_line (account_id);

-- ---------------------------------------------------------------------------
-- Rules
-- ---------------------------------------------------------------------------

create or replace function current_tenant_id() returns uuid
language sql stable
as $$ select nullif(current_setting('app.organisation_id', true), '')::uuid $$;

create or replace function assert_entry_balanced(target uuid) returns void
language plpgsql
as $$
declare
  line_count integer;
  debits     bigint;
  credits    bigint;
begin
  select count(*), coalesce(sum(debit_minor), 0), coalesce(sum(credit_minor), 0)
    into line_count, debits, credits
    from journal_line
   where entry_id = target;

  if line_count < 2 then
    raise exception 'entry % has % line(s); at least two are required', target, line_count;
  end if;

  if debits <> credits then
    raise exception 'entry % is unbalanced: debits % <> credits %', target, debits, credits;
  end if;
end;
$$;

create or replace function check_entry_row() returns trigger
language plpgsql as $$
begin
  perform assert_entry_balanced(new.id);
  return null;
end;
$$;

create or replace function check_line_row() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    perform assert_entry_balanced(old.entry_id);
  else
    perform assert_entry_balanced(new.entry_id);
  end if;
  return null;
end;
$$;

create constraint trigger journal_entry_balanced
  after insert or update on journal_entry
  deferrable initially deferred
  for each row execute function check_entry_row();

create constraint trigger journal_line_balanced
  after insert or update or delete on journal_line
  deferrable initially deferred
  for each row execute function check_line_row();

create or replace function enforce_entry_rules() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'posted' then
      raise exception 'journal entry % is posted and cannot be deleted', old.id;
    end if;
    return old;
  end if;

  if new.organisation_id <> old.organisation_id then
    raise exception 'journal entry % cannot change organisation', old.id;
  end if;

  if old.status = 'posted' then
    raise exception 'journal entry % is posted and cannot be modified', old.id;
  end if;

  return new;
end;
$$;

create trigger journal_entry_rules
  before update or delete on journal_entry
  for each row execute function enforce_entry_rules();

create or replace function enforce_line_rules() returns trigger
language plpgsql as $$
declare
  target  uuid;
  settled text;
begin
  if tg_op = 'DELETE' then
    target := old.entry_id;
  else
    target := new.entry_id;
  end if;

  select status into settled from journal_entry where id = target;

  if settled = 'posted' then
    raise exception 'lines of posted entry % are immutable', target;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger journal_line_rules
  before update or delete on journal_line
  for each row execute function enforce_line_rules();

create or replace function enforce_open_period() returns trigger
language plpgsql as $$
declare
  period fiscal_period;
begin
  select * into period from fiscal_period where id = new.period_id;

  if not found then
    raise exception 'unknown fiscal period %', new.period_id;
  end if;

  if period.status <> 'open' then
    raise exception 'fiscal period % (from %) is closed', period.id, period.starts_on;
  end if;

  if new.entry_date < period.starts_on or new.entry_date > period.ends_on then
    raise exception 'entry date % is outside period % (% to %)',
      new.entry_date, period.id, period.starts_on, period.ends_on;
  end if;

  return new;
end;
$$;

create trigger journal_entry_period
  before insert or update on journal_entry
  for each row execute function enforce_open_period();

-- ---------------------------------------------------------------------------
-- organisation isolation
-- ---------------------------------------------------------------------------

alter table branch          enable row level security;
alter table fiscal_period   enable row level security;
alter table gl_account      enable row level security;
alter table posting_policy  enable row level security;
alter table journal_entry   enable row level security;
alter table journal_line    enable row level security;

alter table branch          force row level security;
alter table fiscal_period   force row level security;
alter table gl_account      force row level security;
alter table posting_policy  force row level security;
alter table journal_entry   force row level security;
alter table journal_line    force row level security;

create policy tenant_isolation on branch
  using ("organisationId" = current_tenant_id())
  with check ("organisationId" = current_tenant_id());

create policy tenant_isolation on fiscal_period
  using (organisation_id = current_tenant_id())
  with check (organisation_id = current_tenant_id());

create policy tenant_isolation on gl_account
  using (organisation_id = current_tenant_id())
  with check (organisation_id = current_tenant_id());

create policy tenant_isolation on posting_policy
  using (organisation_id = current_tenant_id())
  with check (organisation_id = current_tenant_id());

create policy tenant_isolation on journal_entry
  using (organisation_id = current_tenant_id())
  with check (organisation_id = current_tenant_id());

create policy tenant_isolation on journal_line
  using (organisation_id = current_tenant_id())
  with check (organisation_id = current_tenant_id());