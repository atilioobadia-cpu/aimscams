/**
 * The operator surface of the ledger: browse entries, write a balanced entry,
 * post a draft, reverse a posted entry, and read one account's ledger.
 *
 * Nothing here bypasses the database rules. Every write goes through the same
 * triggers the posting engine uses: balanced at commit, open period, immutable
 * once posted. Reversal is a new entry, never an edit.
 */

import type { Db } from './db.js';
import { postEntry, publishJournalEntry, writeEntry, type EntryLineInput, type PostedEntry } from './posting.js';
import type { NormalBalance } from './seed.js';

export type LedgerErrorCode = 'not_found' | 'invalid' | 'conflict';

export class LedgerError extends Error {
  readonly code: LedgerErrorCode;

  constructor(code: LedgerErrorCode, message: string) {
    super(message);
    this.name = 'LedgerError';
    this.code = code;
  }
}

export interface EntrySummary {
  id: string;
  entryNo: string;
  entryDate: string;
  eventCode: string;
  sourceType: string;
  sourceId: string;
  description: string;
  status: 'draft' | 'posted';
  reversalOf: string | null;
  postedAt: string | null;
  createdAt: string;
  lineCount: number;
  debitMinor: bigint;
  creditMinor: bigint;
}

export interface EntryLine {
  id: string;
  lineNo: number;
  accountId: string;
  accountCode: string;
  accountName: string;
  normalBalance: NormalBalance;
  debitMinor: bigint;
  creditMinor: bigint;
  memo: string;
}

export interface EntryDetail extends Omit<EntrySummary, 'lineCount' | 'debitMinor' | 'creditMinor'> {
  lines: EntryLine[];
  debitMinor: bigint;
  creditMinor: bigint;
}

export interface EntryFilter {
  status?: string;
  eventCode?: string;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

interface RawEntry {
  id: string;
  entry_no: unknown;
  entry_date: Date | string;
  event_code: string;
  source_type: string;
  source_id: string;
  description: string;
  status: 'draft' | 'posted';
  reversal_of: string | null;
  posted_at: Date | string | null;
  created_at: Date | string;
  line_count: unknown;
  debit_minor: unknown;
  credit_minor: unknown;
}

function iso(value: Date | string | null): string | null {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function day(value: Date | string): string {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const date = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }
  return String(value).slice(0, 10);
}

function toMinor(value: unknown): bigint {
  return typeof value === 'bigint' ? value : BigInt(String(value ?? 0));
}

function toSummary(row: RawEntry): EntrySummary {
  return {
    id: row.id,
    entryNo: String(row.entry_no),
    entryDate: day(row.entry_date),
    eventCode: row.event_code,
    sourceType: row.source_type,
    sourceId: row.source_id,
    description: row.description,
    status: row.status,
    reversalOf: row.reversal_of,
    postedAt: iso(row.posted_at),
    createdAt: iso(row.created_at) ?? '',
    lineCount: Number(row.line_count ?? 0),
    debitMinor: toMinor(row.debit_minor),
    creditMinor: toMinor(row.credit_minor),
  };
}

const ENTRY_COLUMNS = `e.id, e.entry_no, e.entry_date, e.event_code, e.source_type, e.source_id,
  e.description, e.status, e.reversal_of, e.posted_at, e.created_at,
  count(l.id)::int as line_count,
  coalesce(sum(l.debit_minor), 0)::bigint as debit_minor,
  coalesce(sum(l.credit_minor), 0)::bigint as credit_minor`;

function entryWhere(filter: EntryFilter, tenantId: string): { sql: string; params: unknown[] } {
  const clauses = ['e.organisation_id = $1'];
  const params: unknown[] = [tenantId];

  if (filter.status === 'draft' || filter.status === 'posted') {
    params.push(filter.status);
    clauses.push(`e.status = $${params.length}`);
  }
  if (filter.eventCode?.trim()) {
    params.push(filter.eventCode.trim());
    clauses.push(`e.event_code = $${params.length}`);
  }
  if (filter.from) {
    params.push(filter.from);
    clauses.push(`e.entry_date >= $${params.length}::date`);
  }
  if (filter.to) {
    params.push(filter.to);
    clauses.push(`e.entry_date <= $${params.length}::date`);
  }
  if (filter.q?.trim()) {
    params.push(`%${filter.q.trim().toLowerCase()}%`);
    clauses.push(
      `(lower(e.description) like $${params.length} or lower(e.source_id) like $${params.length}` +
        ` or e.entry_no::text like $${params.length})`,
    );
  }

  return { sql: clauses.join(' and '), params };
}

export async function listEntries(
  db: Db,
  tenantId: string,
  filter: EntryFilter = {},
): Promise<{ entries: EntrySummary[]; total: number }> {
  const where = entryWhere(filter, tenantId);
  const limit = Math.min(Math.max(filter.limit ?? 25, 1), 100);
  const offset = Math.max(filter.offset ?? 0, 0);

  const rows = await db.query<RawEntry>(
    `select ${ENTRY_COLUMNS}
       from journal_entry e
       left join journal_line l
         on l.entry_id = e.id and l.organisation_id = e.organisation_id
      where ${where.sql}
      group by e.id
      order by e.entry_date desc, e.entry_no desc
      limit $${where.params.length + 1} offset $${where.params.length + 2}`,
    [...where.params, limit, offset],
  );

  const count = await db.query<{ total: unknown }>(
    `select count(*) as total from journal_entry e where ${where.sql}`,
    where.params,
  );

  return {
    entries: rows.rows.map(toSummary),
    total: Number(count.rows[0]?.total ?? 0),
  };
}

export async function getEntry(db: Db, tenantId: string, entryId: string): Promise<EntryDetail | null> {
  const header = await db.query<RawEntry>(
    `select ${ENTRY_COLUMNS}
       from journal_entry e
       left join journal_line l
         on l.entry_id = e.id and l.organisation_id = e.organisation_id
      where e.organisation_id = $1 and e.id = $2
      group by e.id`,
    [tenantId, entryId],
  );

  const row = header.rows[0];
  if (!row) return null;

  const lines = await db.query<{
    id: string;
    line_no: number;
    account_id: string;
    code: string;
    name: string;
    normal_balance: NormalBalance;
    debit_minor: unknown;
    credit_minor: unknown;
    memo: string;
  }>(
    `select l.id, l.line_no, l.account_id, a.code, a.name, a.normal_balance,
            l.debit_minor, l.credit_minor, l.memo
       from journal_line l
       join gl_account a
         on a.id = l.account_id and a.organisation_id = l.organisation_id
      where l.organisation_id = $1 and l.entry_id = $2
      order by l.line_no`,
    [tenantId, entryId],
  );

  const summary = toSummary(row);
  return {
    ...summary,
    lines: lines.rows.map((line) => ({
      id: line.id,
      lineNo: Number(line.line_no),
      accountId: line.account_id,
      accountCode: line.code,
      accountName: line.name,
      normalBalance: line.normal_balance,
      debitMinor: toMinor(line.debit_minor),
      creditMinor: toMinor(line.credit_minor),
      memo: line.memo,
    })),
  };
}

export interface CreateEntryInput {
  tenantId: string;
  entryDate: string;
  eventCode?: string;
  sourceType?: string;
  sourceId?: string;
  description?: string;
  lines: readonly EntryLineInput[];
}

export async function createDraft(db: Db, input: CreateEntryInput): Promise<PostedEntry> {
  return writeEntry(db, normalise(input), 'draft');
}

export async function createPostedEntry(db: Db, input: CreateEntryInput): Promise<PostedEntry> {
  return writeEntry(db, normalise(input), 'posted');
}

function normalise(input: CreateEntryInput): Parameters<typeof writeEntry>[1] {
  return {
    tenantId: input.tenantId,
    entryDate: input.entryDate,
    eventCode: input.eventCode?.trim() || 'MANUAL',
    sourceType: input.sourceType?.trim() || 'manual',
    sourceId: input.sourceId?.trim() || `manual:${input.entryDate}:${Date.now()}`,
    description: input.description ?? '',
    lines: input.lines,
  };
}

export async function postDraft(db: Db, tenantId: string, entryId: string): Promise<PostedEntry> {
  return db.transaction(async (tx) => {
    const found = await tx.query<{
      id: string;
      entry_no: unknown;
      entry_date: Date | string;
      event_code: string;
      source_type: string;
      source_id: string;
      status: 'draft' | 'posted';
    }>(
      `select id, entry_no, entry_date, event_code, source_type, source_id, status
         from journal_entry
        where organisation_id = $1 and id = $2
        for update`,
      [tenantId, entryId],
    );

    const row = found.rows[0];
    if (!row) throw new LedgerError('not_found', 'journal entry not found');
    if (row.status === 'posted') {
      return { id: row.id, entryNo: String(row.entry_no), reused: true };
    }

    await tx.query(
      `update journal_entry set status = 'posted', posted_at = now()
        where organisation_id = $1 and id = $2`,
      [tenantId, entryId],
    );

    const entryNo = String(row.entry_no);
    await publishJournalEntry(
      tx,
      {
        tenantId,
        entryDate: day(row.entry_date),
        eventCode: row.event_code,
        sourceType: row.source_type,
        sourceId: row.source_id,
      },
      row.id,
      entryNo,
    );

    return { id: row.id, entryNo, reused: false };
  });
}

export interface ReverseEntryInput {
  tenantId: string;
  entryDate: string;
  description?: string;
}

export async function reverseEntry(
  db: Db,
  entryId: string,
  input: ReverseEntryInput,
): Promise<PostedEntry> {
  const original = await getEntry(db, input.tenantId, entryId);
  if (!original) throw new LedgerError('not_found', 'journal entry not found');
  if (original.status !== 'posted') {
    throw new LedgerError('conflict', 'only a posted entry can be reversed');
  }

  const lines = original.lines.map((line) => ({
    account: line.accountCode,
    debitMinor: line.creditMinor,
    creditMinor: line.debitMinor,
    memo: line.memo,
  }));

  return postEntry(db, {
    tenantId: input.tenantId,
    entryDate: input.entryDate,
    eventCode: 'REVERSAL',
    sourceType: 'journal_entry',
    sourceId: original.id,
    idempotencyKey: `reversal:${original.id}`,
    description: input.description?.trim() || `Reversal of entry ${original.entryNo}`,
    reversalOf: original.id,
    lines,
  });
}

export interface LedgerFilter {
  accountId: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface LedgerRow {
  lineId: string;
  entryId: string;
  entryNo: string;
  entryDate: string;
  description: string;
  eventCode: string;
  memo: string;
  debitMinor: bigint;
  creditMinor: bigint;
  runningMinor: bigint;
}

export interface LedgerPage {
  account: { id: string; code: string; name: string; normalBalance: NormalBalance };
  openingMinor: bigint;
  closingMinor: bigint;
  rows: LedgerRow[];
  total: number;
}

export async function ledgerEntries(
  db: Db,
  tenantId: string,
  filter: LedgerFilter,
): Promise<LedgerPage> {
  const account = await db.query<{
    id: string;
    code: string;
    name: string;
    normal_balance: NormalBalance;
  }>(
    `select id, code, name, normal_balance from gl_account
      where organisation_id = $1 and id = $2`,
    [tenantId, filter.accountId],
  );

  const target = account.rows[0];
  if (!target) throw new LedgerError('not_found', 'ledger account not found');

  const to = filter.to ?? new Date().toISOString().slice(0, 10);
  const from = filter.from ?? '0001-01-01';
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 200);
  const offset = Math.max(filter.offset ?? 0, 0);

  const opening = await db.query<{ opening: unknown }>(
    `select coalesce(sum(case when a.normal_balance = 'debit'
                              then l.debit_minor - l.credit_minor
                              else l.credit_minor - l.debit_minor end), 0)::bigint as opening
       from journal_line l
       join journal_entry e on e.id = l.entry_id and e.organisation_id = l.organisation_id
       join gl_account a on a.id = l.account_id and a.organisation_id = l.organisation_id
      where l.organisation_id = $1 and l.account_id = $2
        and e.status = 'posted' and e.entry_date < $3::date`,
    [tenantId, filter.accountId, from],
  );

  const rows = await db.query<{
    line_id: string;
    entry_id: string;
    entry_no: unknown;
    entry_date: Date | string;
    description: string;
    event_code: string;
    memo: string;
    debit_minor: unknown;
    credit_minor: unknown;
    running_minor: unknown;
  }>(
    `with movements as (
       select l.id as line_id, e.id as entry_id, e.entry_no, e.entry_date,
              e.description, e.event_code, l.memo, l.debit_minor, l.credit_minor,
              sum(case when a.normal_balance = 'debit'
                       then l.debit_minor - l.credit_minor
                       else l.credit_minor - l.debit_minor end)
                over (order by e.entry_date, e.entry_no, l.line_no
                      rows between unbounded preceding and current row)::bigint as running_minor
         from journal_line l
         join journal_entry e on e.id = l.entry_id and e.organisation_id = l.organisation_id
         join gl_account a on a.id = l.account_id and a.organisation_id = l.organisation_id
        where l.organisation_id = $1 and l.account_id = $2
          and e.status = 'posted' and e.entry_date <= $3::date
     )
     select * from movements
      where entry_date >= $4::date
      order by entry_date, entry_no
      limit $5 offset $6`,
    [tenantId, filter.accountId, to, from, limit, offset],
  );

  const count = await db.query<{ total: unknown }>(
    `select count(*) as total
       from journal_line l
       join journal_entry e on e.id = l.entry_id and e.organisation_id = l.organisation_id
      where l.organisation_id = $1 and l.account_id = $2
        and e.status = 'posted' and e.entry_date between $3::date and $4::date`,
    [tenantId, filter.accountId, from, to],
  );

  const openingMinor = toMinor(opening.rows[0]?.opening);
  const last = rows.rows[rows.rows.length - 1];

  return {
    account: {
      id: target.id,
      code: target.code,
      name: target.name,
      normalBalance: target.normal_balance,
    },
    openingMinor,
    closingMinor: last ? toMinor(last.running_minor) : openingMinor,
    rows: rows.rows.map((row) => ({
      lineId: row.line_id,
      entryId: row.entry_id,
      entryNo: String(row.entry_no),
      entryDate: day(row.entry_date),
      description: row.description,
      eventCode: row.event_code,
      memo: row.memo,
      debitMinor: toMinor(row.debit_minor),
      creditMinor: toMinor(row.credit_minor),
      runningMinor: toMinor(row.running_minor),
    })),
    total: Number(count.rows[0]?.total ?? 0),
  };
}
