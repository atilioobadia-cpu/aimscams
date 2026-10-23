/**
 * Reports read the book; they never write it.
 *
 * A trial balance is the first tie-out: for every account, the debits and
 * credits posted up to a date, and the balance on the account's normal side.
 * Total debits must equal total credits, or something is wrong and the report
 * refuses to pretend otherwise.
 */

import type { Db } from './db.js';
import type { AccountType, NormalBalance } from './seed.js';

export interface TrialBalanceRow {
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  debitMinor: bigint;
  creditMinor: bigint;
  balanceMinor: bigint;
}

export interface TrialBalance {
  asOf: string;
  rows: TrialBalanceRow[];
  debitMinor: bigint;
  creditMinor: bigint;
}

interface RawRow {
  code: string;
  name: string;
  type: AccountType;
  normal_balance: NormalBalance;
  debit_minor: unknown;
  credit_minor: unknown;
}

export async function trialBalance(
  db: Db,
  tenantId: string,
  asOf: string,
): Promise<TrialBalance> {
  const result = await db.query<RawRow>(
    `select a.code,
            a.name,
            a.type,
            a.normal_balance,
            coalesce(sum(l.debit_minor), 0)  as debit_minor,
            coalesce(sum(l.credit_minor), 0) as credit_minor
       from gl_account a
       left join (
         select line.account_id, line.debit_minor, line.credit_minor
           from journal_line line
           join journal_entry entry on entry.id = line.entry_id
          where entry.tenant_id = $1
            and entry.status = 'posted'
            and entry.entry_date <= $2::date
       ) l on l.account_id = a.id
      where a.tenant_id = $1
        and a.is_postable
      group by a.code, a.name, a.type, a.normal_balance
      order by a.code`,
    [tenantId, asOf],
  );

  const rows = result.rows.map<TrialBalanceRow>((row) => {
    const debitMinor = asBigInt(row.debit_minor);
    const creditMinor = asBigInt(row.credit_minor);
    const balanceMinor =
      row.normal_balance === 'debit' ? debitMinor - creditMinor : creditMinor - debitMinor;
    return {
      code: row.code,
      name: row.name,
      type: row.type,
      normalBalance: row.normal_balance,
      debitMinor,
      creditMinor,
      balanceMinor,
    };
  });

  const debitMinor = rows.reduce((total, row) => total + row.debitMinor, 0n);
  const creditMinor = rows.reduce((total, row) => total + row.creditMinor, 0n);

  if (debitMinor !== creditMinor) {
    throw new Error(
      `trial balance does not tie out at ${asOf}: debit ${debitMinor} <> credit ${creditMinor}`,
    );
  }

  return { asOf, rows, debitMinor, creditMinor };
}

/** The balance of one account at a date, on its normal side. */
export async function accountBalance(
  db: Db,
  tenantId: string,
  code: string,
  asOf: string,
): Promise<bigint> {
  const balance = await trialBalance(db, tenantId, asOf);
  const row = balance.rows.find((candidate) => candidate.code === code);
  if (!row) throw new Error(`account ${code} is not in the chart of accounts`);
  return row.balanceMinor;
}

function asBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'string' || typeof value === 'number') return BigInt(value);
  throw new Error(`expected an integer amount, received ${typeof value}`);
}
