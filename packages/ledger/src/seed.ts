/**
 * Chart of accounts and posting policy for a new tenant.
 *
 * Codes and names follow the observed ledger where it was captured; anything
 * the screenshots did not show is flagged `is_assumption` so an adviser can
 * find it without reading the code. Nothing here is specific to the observed
 * tenant's history — this is the AIMSCAMS starting template (D-014).
 */

import type { Db } from './db.js';

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';
export type NormalBalance = 'debit' | 'credit';

export interface AccountSeed {
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  assumption?: boolean;
}

export const CHART_OF_ACCOUNTS: readonly AccountSeed[] = [
  { code: '1002', name: 'Cash on hand', type: 'asset', normalBalance: 'debit' },
  { code: '1003', name: 'Bank - CRDB', type: 'asset', normalBalance: 'debit' },
  { code: '1005', name: 'Bank - NMB', type: 'asset', normalBalance: 'debit' },
  { code: '1010', name: 'Teller cash', type: 'asset', normalBalance: 'debit' },
  { code: '1201', name: 'Loans receivable', type: 'asset', normalBalance: 'debit' },
  { code: '1205', name: 'Staff loans', type: 'asset', normalBalance: 'debit' },
  { code: '1505', name: 'Interest receivable', type: 'asset', normalBalance: 'debit' },
  { code: '2001', name: 'Tax payable', type: 'liability', normalBalance: 'credit' },
  { code: '2004', name: 'Overpayments', type: 'liability', normalBalance: 'credit' },
  { code: '2005', name: 'Accounts payable', type: 'liability', normalBalance: 'credit' },
  {
    code: '2101',
    name: 'Member savings',
    type: 'liability',
    normalBalance: 'credit',
    assumption: true,
  },
  { code: '3404', name: 'Share capital', type: 'equity', normalBalance: 'credit' },
  { code: '4001', name: 'Interest income - loans', type: 'income', normalBalance: 'credit' },
  { code: '4101', name: 'Loan management fee', type: 'income', normalBalance: 'credit' },
  { code: '4104', name: 'Loan penalty', type: 'income', normalBalance: 'credit' },
  {
    code: '5001',
    name: 'Interest expense - member savings',
    type: 'expense',
    normalBalance: 'debit',
    assumption: true,
  },
  { code: '5004', name: 'Write-off - bad loans', type: 'expense', normalBalance: 'debit' },
  { code: '5502', name: 'Bank charges', type: 'expense', normalBalance: 'debit' },
] as const;

export type AmountKey = 'total' | 'principal' | 'interest' | 'penalty' | 'charges';

export interface PolicyLine {
  account: string;
  side: 'debit' | 'credit';
  amount: AmountKey;
}

export interface PolicySeed {
  eventCode: string;
  lines: readonly PolicyLine[];
  assumption?: boolean;
  note?: string;
}

export const POSTING_POLICIES: readonly PolicySeed[] = [
  {
    eventCode: 'SAVINGS_DEPOSIT',
    lines: [
      { account: '1002', side: 'debit', amount: 'total' },
      { account: '2101', side: 'credit', amount: 'total' },
    ],
  },
  {
    eventCode: 'SAVINGS_WITHDRAWAL',
    lines: [
      { account: '2101', side: 'debit', amount: 'total' },
      { account: '1002', side: 'credit', amount: 'total' },
    ],
  },
  {
    eventCode: 'LOAN_DISBURSEMENT',
    lines: [
      { account: '1201', side: 'debit', amount: 'total' },
      { account: '1002', side: 'credit', amount: 'total' },
    ],
  },
  {
    eventCode: 'LOAN_REPAYMENT',
    lines: [
      { account: '1002', side: 'debit', amount: 'total' },
      { account: '1201', side: 'credit', amount: 'principal' },
      { account: '4001', side: 'credit', amount: 'interest' },
      { account: '4104', side: 'credit', amount: 'penalty' },
      { account: '4101', side: 'credit', amount: 'charges' },
    ],
    assumption: true,
    note:
      'Observed ledger shows Dr 1205 Staff Loan + Dr 4005 Interest Income / Cr 1005 Bank. ' +
      'This template posts the standard direction because debiting income is not double ' +
      'entry and 1205 is the staff-loan ledger (D-017). The split remains an assumption.',
  },
  {
    eventCode: 'LOAN_WRITE_OFF',
    lines: [
      { account: '5004', side: 'debit', amount: 'total' },
      { account: '1201', side: 'credit', amount: 'total' },
    ],
  },
  {
    eventCode: 'FEE_INCOME',
    lines: [
      { account: '1002', side: 'debit', amount: 'total' },
      { account: '4101', side: 'credit', amount: 'total' },
    ],
  },
  {
    eventCode: 'SHARE_CAPITAL',
    lines: [
      { account: '1002', side: 'debit', amount: 'total' },
      { account: '3404', side: 'credit', amount: 'total' },
    ],
  },
] as const;

export async function seedChartOfAccounts(
  db: Db,
  tenantId: string,
  accounts: readonly AccountSeed[] = CHART_OF_ACCOUNTS,
): Promise<number> {
  let inserted = 0;
  for (const account of accounts) {
    const result = await db.query(
      `insert into gl_account (tenant_id, code, name, type, normal_balance, is_assumption)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (tenant_id, code) do nothing
       returning id`,
      [
        tenantId,
        account.code,
        account.name,
        account.type,
        account.normalBalance,
        account.assumption ?? false,
      ],
    );
    inserted += result.rows.length;
  }
  return inserted;
}

export async function seedPostingPolicies(
  db: Db,
  tenantId: string,
  policies: readonly PolicySeed[] = POSTING_POLICIES,
): Promise<number> {
  let inserted = 0;
  for (const policy of policies) {
    const result = await db.query(
      `insert into posting_policy (tenant_id, event_code, version, lines, is_assumption, note)
       values ($1, $2, 1, $3::jsonb, $4, $5)
       on conflict (tenant_id, event_code, version) do nothing
       returning id`,
      [
        tenantId,
        policy.eventCode,
        JSON.stringify(policy.lines),
        policy.assumption ?? false,
        policy.note ?? '',
      ],
    );
    inserted += result.rows.length;
  }
  return inserted;
}

export type Dialect = 'SACCOS' | 'MFI';
export type CouncilType = 'CC' | 'MC' | 'DC' | 'TC';

export interface TenantInput {
  code: string;
  name: string;
  dialect: Dialect;
  branch?: {
    code?: string;
    name?: string;
    councilType?: CouncilType;
  };
  /** At least one fiscal period. Usually the current year and the next. */
  periods: readonly { startsOn: string; endsOn: string }[];
}

export interface ProvisionedTenant {
  tenantId: string;
  branchId: string;
  periodIds: string[];
  accounts: number;
  policies: number;
  /** True when the tenant already existed and only missing pieces were added. */
  reused: boolean;
}

/**
 * Creates a tenant, its head-office branch, its fiscal periods, the chart of
 * accounts and the posting policies — one transaction, idempotent by tenant
 * code, so a retried deployment cannot create a second book.
 *
 * Overlapping periods are refused here rather than in the schema: a period
 * overlap would let one day belong to two books, and the posting engine picks
 * a period by date.
 */
export async function provisionTenant(db: Db, input: TenantInput): Promise<ProvisionedTenant> {
  if (input.periods.length === 0) {
    throw new Error('a tenant needs at least one fiscal period');
  }

  const ordered = [...input.periods].sort((a, b) => a.startsOn.localeCompare(b.startsOn));
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (previous && current && previous.endsOn >= current.startsOn) {
      throw new Error(
        `fiscal periods overlap: ${previous.startsOn}..${previous.endsOn} and ` +
          `${current.startsOn}..${current.endsOn}`,
      );
    }
  }

  return db.transaction(async (tx) => {
    const created = await tx.query<{ id: string }>(
      `insert into tenant (code, name, dialect)
       values ($1, $2, $3)
       on conflict (code) do nothing
       returning id`,
      [input.code, input.name, input.dialect],
    );

    let tenantId = created.rows[0]?.id;
    if (!tenantId) {
      const existing = await tx.query<{ id: string }>(`select id from tenant where code = $1`, [
        input.code,
      ]);
      tenantId = existing.rows[0]?.id;
    }
    if (!tenantId) throw new Error(`tenant ${input.code} could not be created or found`);

    const branchCode = input.branch?.code ?? 'HQ';
    const branchName = input.branch?.name ?? 'Head office';

    const branch = await tx.query<{ id: string }>(
      `insert into branch (tenant_id, code, name, council_type)
       values ($1, $2, $3, $4)
       on conflict (tenant_id, code) do nothing
       returning id`,
      [tenantId, branchCode, branchName, input.branch?.councilType ?? null],
    );

    let branchId = branch.rows[0]?.id;
    if (!branchId) {
      const existing = await tx.query<{ id: string }>(
        `select id from branch where tenant_id = $1 and code = $2`,
        [tenantId, branchCode],
      );
      branchId = existing.rows[0]?.id;
    }
    if (!branchId) throw new Error(`branch ${branchCode} could not be created or found`);

    const periodIds: string[] = [];
    for (const period of ordered) {
      const row = await tx.query<{ id: string }>(
        `insert into fiscal_period (tenant_id, starts_on, ends_on)
         values ($1, $2, $3)
         on conflict (tenant_id, starts_on) do nothing
         returning id`,
        [tenantId, period.startsOn, period.endsOn],
      );

      let periodId = row.rows[0]?.id;
      if (!periodId) {
        const existing = await tx.query<{ id: string }>(
          `select id from fiscal_period where tenant_id = $1 and starts_on = $2`,
          [tenantId, period.startsOn],
        );
        periodId = existing.rows[0]?.id;
      }
      if (!periodId) throw new Error(`period ${period.startsOn} could not be created or found`);
      periodIds.push(periodId);
    }

    const accounts = await seedChartOfAccounts(tx, tenantId);
    const policies = await seedPostingPolicies(tx, tenantId);

    return {
      tenantId,
      branchId,
      periodIds,
      accounts,
      policies,
      reused: created.rows.length === 0,
    };
  });
}
