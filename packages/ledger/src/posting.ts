/**
 * The posting engine.
 *
 * One rule: an entry is written as a draft, its lines are written, and then it
 * is marked posted â€” all inside a transaction. If anything is wrong the
 * database refuses the commit, so a half-posted entry cannot exist.
 *
 * The engine validates before it writes as well, but that is for a readable
 * error, not for safety: the constraint triggers in `schema.sql` are what
 * actually guarantee the ledger.
 */

import type { Money } from '@aimscams/domain';

import type { Db } from './db.js';
import { enqueueOutbox } from './outbox.js';
import type { AmountKey, PolicyLine } from './seed.js';

export interface EntryLineInput {
  account: string;
  debitMinor?: bigint;
  creditMinor?: bigint;
  memo?: string;
}

export interface PostEntryInput {
  tenantId: string;
  entryDate: string;
  eventCode: string;
  sourceType: string;
  sourceId: string;
  idempotencyKey?: string;
  description?: string;
  reversalOf?: string;
  lines: readonly EntryLineInput[];
}

export interface PostedEntry {
  id: string;
  entryNo: string;
  reused: boolean;
}

export interface PostEventInput {
  tenantId: string;
  entryDate: string;
  eventCode: string;
  sourceType: string;
  sourceId: string;
  idempotencyKey?: string;
  description?: string;
  amounts: Partial<Record<AmountKey, Money>>;
}

export async function postEntry(db: Db, input: PostEntryInput): Promise<PostedEntry> {
  return writeEntry(db, input, 'posted');
}

/**
 * Write an entry either as a draft or as a posted entry.
 *
 * A draft is still balanced and still inside an open period — the database
 * checks both at commit. Posting a draft later is a status change; the entry
 * and its lines are never rewritten in place.
 */
export async function writeEntry(
  db: Db,
  input: PostEntryInput,
  status: 'draft' | 'posted',
): Promise<PostedEntry> {
  validateEntryLines(input.lines);

  if (input.idempotencyKey) {
    const existing = await db.query<{ id: string; entry_no: unknown }>(
      `select id, entry_no from journal_entry where organisation_id = $1 and idempotency_key = $2`,
      [input.tenantId, input.idempotencyKey],
    );
    const row = existing.rows[0];
    if (row) return { id: row.id, entryNo: String(row.entry_no), reused: true };
  }

  return db.transaction(async (tx) => {
    const period = await tx.query<{ id: string }>(
      `select id from fiscal_period
        where organisation_id = $1 and $2::date between starts_on and ends_on`,
      [input.tenantId, input.entryDate],
    );
    const periodId = period.rows[0]?.id;
    if (!periodId) throw new Error(`no fiscal period covers ${input.entryDate}`);

    const codes = [...new Set(input.lines.map((line) => line.account))];
    const accounts = await tx.query<{ id: string; code: string }>(
      `select id, code from gl_account where organisation_id = $1 and code = any($2::text[])`,
      [input.tenantId, codes],
    );
    const accountId = new Map(accounts.rows.map((row) => [row.code, row.id]));

    for (const code of codes) {
      if (!accountId.has(code)) {
        throw new Error(`account ${code} is not in the chart of accounts`);
      }
    }

    const entry = await tx.query<{ id: string; entry_no: unknown }>(
      `insert into journal_entry
         (organisation_id, entry_date, period_id, event_code, source_type, source_id,
          description, idempotency_key, reversal_of, status, posted_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       returning id, entry_no`,
      [
        input.tenantId,
        input.entryDate,
        periodId,
        input.eventCode,
        input.sourceType,
        input.sourceId,
        input.description ?? '',
        input.idempotencyKey ?? null,
        input.reversalOf ?? null,
        status,
        status === 'posted' ? new Date().toISOString() : null,
      ],
    );

    const entryRow = entry.rows[0];
    if (!entryRow) throw new Error('journal entry was not created');

    let lineNo = 0;
    for (const line of input.lines) {
      lineNo += 1;
      await tx.query(
        `insert into journal_line
           (organisation_id, entry_id, line_no, account_id, debit_minor, credit_minor, memo)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          input.tenantId,
          entryRow.id,
          lineNo,
          accountId.get(line.account),
          line.debitMinor ?? 0n,
          line.creditMinor ?? 0n,
          line.memo ?? '',
        ],
      );
    }

    const entryNo = String(entryRow.entry_no);
    if (status === 'posted') {
      await publishJournalEntry(tx, input, entryRow.id, entryNo);
    }

    return { id: entryRow.id, entryNo, reused: false };
  });
}

/**
 * The outbox row that belongs to a posted entry. Written in the same
 * transaction as the entry, so commit and event are atomic.
 */
export async function publishJournalEntry(
  tx: Db,
  input: Pick<PostEntryInput, 'tenantId' | 'entryDate' | 'eventCode' | 'sourceType' | 'sourceId'>,
  entryId: string,
  entryNo: string,
): Promise<void> {
  await enqueueOutbox(tx, {
    tenantId: input.tenantId,
    eventType: 'journal.posted',
    aggregateType: 'journal_entry',
    aggregateId: entryId,
    idempotencyKey: `journal.posted:${entryId}`,
    payload: {
      entryId,
      entryNo,
      entryDate: input.entryDate,
      eventCode: input.eventCode,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    },
  });
}

export async function postEvent(db: Db, input: PostEventInput): Promise<PostedEntry> {
  const policy = await db.query<{ lines: PolicyLine[] }>(
    `select lines from posting_policy
      where organisation_id = $1 and event_code = $2
      order by version desc
      limit 1`,
    [input.tenantId, input.eventCode],
  );

  const policyLines = policy.rows[0]?.lines;
  if (!policyLines) throw new Error(`no posting policy for event ${input.eventCode}`);

  const lines: EntryLineInput[] = [];
  for (const line of policyLines) {
    const amount = input.amounts[line.amount];
    if (!amount || amount.minor === 0n) continue;
    lines.push({
      account: line.account,
      debitMinor: line.side === 'debit' ? amount.minor : 0n,
      creditMinor: line.side === 'credit' ? amount.minor : 0n,
    });
  }

  return postEntry(db, { ...input, lines });
}

export function validateEntryLines(lines: readonly EntryLineInput[]): void {
  if (lines.length < 2) {
    throw new Error('an entry needs at least two lines');
  }

  let debits = 0n;
  let credits = 0n;

  for (const line of lines) {
    const debit = line.debitMinor ?? 0n;
    const credit = line.creditMinor ?? 0n;

    if (debit < 0n || credit < 0n) throw new Error('debit and credit must not be negative');
    if ((debit === 0n) === (credit === 0n)) {
      throw new Error('each line must carry exactly one of debit or credit');
    }

    debits += debit;
    credits += credit;
  }

  if (debits !== credits) {
    throw new Error(`entry is unbalanced: debit ${debits} <> credit ${credits}`);
  }
}

