/**
 * The posting engine.
 *
 * One rule: an entry is written as a draft, its lines are written, and then it
 * is marked posted — all inside a transaction. If anything is wrong the
 * database refuses the commit, so a half-posted entry cannot exist.
 *
 * The engine validates before it writes as well, but that is for a readable
 * error, not for safety: the constraint triggers in `schema.sql` are what
 * actually guarantee the ledger.
 */

import type { Money } from '@aimscams/domain';

import type { Db } from './db.js';
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
  validate(input.lines);

  if (input.idempotencyKey) {
    const existing = await db.query<{ id: string; entry_no: unknown }>(
      `select id, entry_no from journal_entry where tenant_id = $1 and idempotency_key = $2`,
      [input.tenantId, input.idempotencyKey],
    );
    const row = existing.rows[0];
    if (row) return { id: row.id, entryNo: String(row.entry_no), reused: true };
  }

  return db.transaction(async (tx) => {
    const period = await tx.query<{ id: string }>(
      `select id from fiscal_period
        where tenant_id = $1 and $2::date between starts_on and ends_on`,
      [input.tenantId, input.entryDate],
    );
    const periodId = period.rows[0]?.id;
    if (!periodId) throw new Error(`no fiscal period covers ${input.entryDate}`);

    const codes = [...new Set(input.lines.map((line) => line.account))];
    const accounts = await tx.query<{ id: string; code: string }>(
      `select id, code from gl_account where tenant_id = $1 and code = any($2::text[])`,
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
         (tenant_id, entry_date, period_id, event_code, source_type, source_id,
          description, idempotency_key, reversal_of)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
      ],
    );

    const entryRow = entry.rows[0];
    if (!entryRow) throw new Error('journal entry was not created');

    let lineNo = 0;
    for (const line of input.lines) {
      lineNo += 1;
      await tx.query(
        `insert into journal_line
           (tenant_id, entry_id, line_no, account_id, debit_minor, credit_minor, memo)
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

    await tx.query(
      `update journal_entry set status = 'posted', posted_at = now() where id = $1`,
      [entryRow.id],
    );

    return { id: entryRow.id, entryNo: String(entryRow.entry_no), reused: false };
  });
}

export async function postEvent(db: Db, input: PostEventInput): Promise<PostedEntry> {
  const policy = await db.query<{ lines: PolicyLine[] }>(
    `select lines from posting_policy
      where tenant_id = $1 and event_code = $2
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

function validate(lines: readonly EntryLineInput[]): void {
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
