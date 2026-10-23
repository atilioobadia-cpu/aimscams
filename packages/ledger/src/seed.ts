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
      'This template uses standard double entry; replace with the observed direction if the ' +
      'accountant confirms it (D-015).',
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
