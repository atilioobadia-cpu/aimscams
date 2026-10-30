/**
 * Chart of accounts and posting policy for a new organisation.
 *
 * Codes and names follow the observed ledger where it was captured; anything
 * the screenshots did not show is flagged `is_assumption` so an adviser can
 * find it without reading the code. Nothing here is specific to the observed
 * organisation's history â€” this is the AIMSCAMS starting template (D-014).
 */

import type { Db } from './db.js';

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';
export type NormalBalance = 'debit' | 'credit';

export interface AccountSeed {
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  isGroup?: boolean;
  parentCode?: string;
  assumption?: boolean;
}

export const CHART_OF_ACCOUNTS: readonly AccountSeed[] = [
  { code: '1', name: 'Assets', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: undefined, assumption: undefined },
  { code: '2', name: 'Liabilities and owners equity', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: undefined, assumption: undefined },
  { code: '3', name: 'Capital account', type: 'equity', normalBalance: 'credit', isGroup: true, parentCode: undefined, assumption: undefined },
  { code: '4', name: 'Incomes', type: 'income', normalBalance: 'credit', isGroup: true, parentCode: undefined, assumption: undefined },
  { code: '5', name: 'Expenses', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: undefined, assumption: undefined },
  { code: '1000', name: 'Cash and cash equivalents', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1001', name: 'AIMSCAMS', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1000', assumption: undefined },
  { code: '1002', name: 'Cash on hand', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1000', assumption: undefined },
  { code: '1003', name: 'Bank CRDB', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1000', assumption: undefined },
  { code: '1005', name: 'Bank NMB', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1000', assumption: undefined },
  { code: '1010', name: 'Tellers', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1000', assumption: undefined },
  { code: '1011', name: 'Teller 2', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1010', assumption: undefined },
  { code: '1012', name: 'Teller 1', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1010', assumption: undefined },
  { code: '1100', name: 'Short term investments', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1200', name: 'Total loans', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1201', name: 'Asset loan', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1200', assumption: undefined },
  { code: '1202', name: 'Emergency loan', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1200', assumption: undefined },
  { code: '1203', name: 'Business loan', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1200', assumption: undefined },
  { code: '1204', name: 'Housing loan', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1200', assumption: undefined },
  { code: '1205', name: 'Staff loan', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1200', assumption: undefined },
  { code: '1206', name: 'Suspense on loan', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1200', assumption: undefined },
  { code: '1300', name: 'Cumulative loan losses', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1400', name: 'Interest and expected fees', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1500', name: 'Current assets', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1501', name: 'Prepaid corporate tax', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1500', assumption: undefined },
  { code: '1502', name: 'Loan processing fees receivable', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1500', assumption: undefined },
  { code: '1503', name: 'Staff advances/receivables', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1500', assumption: undefined },
  { code: '1504', name: 'Prepaid expenses', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1500', assumption: undefined },
  { code: '1505', name: 'Interest receivable', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1500', assumption: undefined },
  { code: '1600', name: 'Long - term investments', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1700', name: 'Non-current assets', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1701', name: 'Furniture & fittings', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1700', assumption: undefined },
  { code: '1702', name: 'Office equipment', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1700', assumption: undefined },
  { code: '1703', name: 'Motorbikes for agents', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1700', assumption: undefined },
  { code: '1704', name: 'GPS Trackers', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1700', assumption: undefined },
  { code: '1705', name: 'Fireproof safe & cabinets', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1700', assumption: undefined },
  { code: '1706', name: 'Software licenses', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1700', assumption: undefined },
  { code: '1707', name: 'Leasehold improvements', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1700', assumption: undefined },
  { code: '2000', name: 'Current liabilities', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '2001', name: 'Tax payable (current tax liabilities)', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2002', name: 'AIMSCAMS Charges', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2003', name: 'Insurance premiums', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2004', name: 'Overpayments', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2005', name: 'Accounts payable', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2006', name: 'Staff salaries payable', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2007', name: 'Interest payable to lenders', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2008', name: 'Deferred loan income', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2009', name: 'Accrued expenses', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2010', name: 'Down payment', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2011', name: 'Tax payable', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2100', name: 'Interest debts', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '2200', name: 'Members savings and deposits', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '2300', name: 'Short - term loans', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '2400', name: 'Long - term loans', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '2401', name: 'Long-term loans from lenders', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2400', assumption: undefined },
  { code: '2500', name: 'Unpaid expenses', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '2501', name: 'Accumulated depreciation', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2500', assumption: undefined },
  { code: '2600', name: 'Suspended income', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '2700', name: 'Postponed subsidies', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '3000', name: 'Members shares', type: 'equity', normalBalance: 'credit', isGroup: true, parentCode: '3', assumption: undefined },
  { code: '3100', name: 'Profit/ loss', type: 'equity', normalBalance: 'credit', isGroup: true, parentCode: '3', assumption: undefined },
  { code: '3101', name: 'Profit and loss a/c', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3100', assumption: undefined },
  { code: '3200', name: 'Accumulation of profit / loss for the relevant year', type: 'equity', normalBalance: 'credit', isGroup: true, parentCode: '3', assumption: undefined },
  { code: '3300', name: 'Accumulation of profit / loss for the past years', type: 'equity', normalBalance: 'credit', isGroup: true, parentCode: '3', assumption: undefined },
  { code: '3400', name: "CHANGE OF OWNER'S EQUITY", type: 'equity', normalBalance: 'credit', isGroup: true, parentCode: '3', assumption: undefined },
  { code: '3401', name: 'Education fund', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3402', name: 'Statutory reserve funds', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3403', name: 'Share transfer fund', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3404', name: 'Share capital', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3405', name: 'Retained earning', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3406', name: 'Grants', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3407', name: 'Insurance fund', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3408', name: 'Revaluation reserves', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3409', name: 'Bad and doubtful debts provision', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '4000', name: 'Interest income', type: 'income', normalBalance: 'credit', isGroup: true, parentCode: '4', assumption: undefined },
  { code: '4001', name: 'Interest income on asset loan', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4000', assumption: undefined },
  { code: '4002', name: 'Interest income on emergency loan', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4000', assumption: undefined },
  { code: '4003', name: 'Interest income on housing loan', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4000', assumption: undefined },
  { code: '4004', name: 'Interest income on business loan', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4000', assumption: undefined },
  { code: '4005', name: 'Interest income on staff loan', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4000', assumption: undefined },
  { code: '4100', name: 'Other income from loans', type: 'income', normalBalance: 'credit', isGroup: true, parentCode: '4', assumption: undefined },
  { code: '4101', name: 'Loan management fee', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4100', assumption: undefined },
  { code: '4102', name: 'Device tracking fee', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4100', assumption: undefined },
  { code: '4103', name: 'Loan restructuring fee', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4100', assumption: undefined },
  { code: '4104', name: 'Loan penalty', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4100', assumption: undefined },
  { code: '4200', name: 'Other income', type: 'income', normalBalance: 'credit', isGroup: true, parentCode: '4', assumption: undefined },
  { code: '4201', name: 'Insurance commision', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4200', assumption: undefined },
  { code: '4202', name: 'Income from sale of repossessed assets', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4200', assumption: undefined },
  { code: '4203', name: 'Subscription fees', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4200', assumption: undefined },
  { code: '4204', name: 'Other operational income', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4200', assumption: undefined },
  { code: '4300', name: 'Income to generate investments', type: 'income', normalBalance: 'credit', isGroup: true, parentCode: '4', assumption: undefined },
  { code: '4400', name: 'Subsidies', type: 'income', normalBalance: 'credit', isGroup: true, parentCode: '4', assumption: undefined },
  { code: '4500', name: 'Other revenues', type: 'income', normalBalance: 'credit', isGroup: true, parentCode: '4', assumption: undefined },
  { code: '5000', name: 'Loan expenses', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5001', name: 'Tracker device purchase & installation', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5000', assumption: undefined },
  { code: '5002', name: 'Field transport (loan monitoring)', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5000', assumption: undefined },
  { code: '5003', name: 'Loan loss provision', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5000', assumption: undefined },
  { code: '5004', name: 'Write-off – bad loans', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5000', assumption: undefined },
  { code: '5005', name: 'Fuel – motorbikes', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5000', assumption: undefined },
  { code: '5100', name: 'HR & development', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5101', name: 'Subscriptions', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5102', name: 'Training & team building', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5103', name: 'Consultancy fees', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5104', name: 'Director’s fees', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5105', name: 'Volunteers/ambassadors stipends', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5106', name: 'Nhif medical insurance', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5107', name: 'Repairs & maintenance', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5108', name: 'Board expenses', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5109', name: 'Tea/coffee & staff meals', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5200', name: 'Administrative costs', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5201', name: 'Salaries & wages – all staff', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5202', name: 'Rent', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5203', name: 'Utilities (electricity, water)', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5204', name: 'Internet & communications', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5205', name: 'Stationery & printing', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5206', name: 'Cleaning services', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5207', name: 'Advertising & promotion', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5208', name: 'Office supplies', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5209', name: 'Professional fees', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5210', name: 'Insurance', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5211', name: 'License & regulatory fees', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5212', name: 'Software subscription & maintenance', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5213', name: 'Current year depreciation', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5214', name: 'Travelling allowance and accomodation', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5215', name: 'Marketing and advertisement', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5216', name: 'Nssf contribution', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5217', name: 'S/duty lease', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5300', name: 'Business costs', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5400', name: 'Equipment costs', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5401', name: 'Current year depreciation', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5400', assumption: undefined },
  { code: '5500', name: 'Other costs', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5501', name: 'AIMSCAMS Fees', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5500', assumption: undefined },
  { code: '5502', name: 'Bank charges', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5500', assumption: undefined },
  { code: '5600', name: 'Office costs', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5700', name: 'Estate expenses', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5800', name: 'Travel costs', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5900', name: 'System costs', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '2101', name: 'Member savings', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2', assumption: true },
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
  const idByCode = new Map<string, string>();
  for (const account of accounts) {
    const parentCode = account.parentCode;
    const parentId = parentCode ? idByCode.get(parentCode) ?? null : null;
    const result = await db.query<{ id: string }>(
      `insert into gl_account (organisation_id, code, name, type, normal_balance, is_postable, is_group, parent_id, is_assumption)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       on conflict (organisation_id, code) do nothing
       returning id`,
      [
        tenantId,
        account.code,
        account.name,
        account.type,
        account.normalBalance,
        !(account.isGroup ?? false),
        account.isGroup ?? false,
        parentId,
        account.assumption ?? false,
      ],
    );
    const newId = result.rows[0]?.id;
    if (newId) {
      idByCode.set(account.code, newId);
      inserted += 1;
    } else {
      // already existed: look up id
      const existing = await db.query<{ id: string }>(
        `select id from gl_account where organisation_id = $1 and code = $2`,
        [tenantId, account.code],
      );
      const existingId = existing.rows[0]?.id;
      if (existingId) idByCode.set(account.code, existingId);
    }
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
      `insert into posting_policy (organisation_id, event_code, version, lines, is_assumption, note)
       values ($1, $2, 1, $3::jsonb, $4, $5)
       on conflict (organisation_id, event_code, version) do nothing
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

export type Dialect = 'TCDC' | 'BOT';
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
  /** True when the organisation already existed and only missing pieces were added. */
  reused: boolean;
}

/**
 * Creates a organisation, its head-office branch, its fiscal periods, the chart of
 * accounts and the posting policies â€” one transaction, idempotent by organisation
 * code, so a retried deployment cannot create a second book.
 *
 * Overlapping periods are refused here rather than in the schema: a period
 * overlap would let one day belong to two books, and the posting engine picks
 * a period by date.
 */
export async function provisionTenant(db: Db, input: TenantInput): Promise<ProvisionedTenant> {
  if (input.periods.length === 0) {
    throw new Error('a organisation needs at least one fiscal period');
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
      `insert into organisation (code, name, dialect)
       values ($1, $2, $3)
       on conflict (code) do nothing
       returning id`,
      [input.code, input.name, input.dialect],
    );

    let tenantId = created.rows[0]?.id;
    if (!tenantId) {
      const existing = await tx.query<{ id: string }>(`select id from organisation where code = $1`, [
        input.code,
      ]);
      tenantId = existing.rows[0]?.id;
    }
    if (!tenantId) throw new Error(`organisation ${input.code} could not be created or found`);

    const branchCode = input.branch?.code ?? 'HQ';
    const branchName = input.branch?.name ?? 'Head office';

    const branch = await tx.query<{ id: string }>(
      `insert into branch ("organisationId", code, name, "councilType")
       values ($1, $2, $3, $4)
       on conflict ("organisationId", code) do nothing
       returning id`,
      [tenantId, branchCode, branchName, input.branch?.councilType ?? null],
    );

    let branchId = branch.rows[0]?.id;
    if (!branchId) {
      const existing = await tx.query<{ id: string }>(
        `select id from branch where "organisationId" = $1 and code = $2`,
        [tenantId, branchCode],
      );
      branchId = existing.rows[0]?.id;
    }
    if (!branchId) throw new Error(`branch ${branchCode} could not be created or found`);

    const periodIds: string[] = [];
    for (const period of ordered) {
      const row = await tx.query<{ id: string }>(
        `insert into fiscal_period (organisation_id, starts_on, ends_on)
         values ($1, $2, $3)
         on conflict (organisation_id, starts_on) do nothing
         returning id`,
        [tenantId, period.startsOn, period.endsOn],
      );

      let periodId = row.rows[0]?.id;
      if (!periodId) {
        const existing = await tx.query<{ id: string }>(
          `select id from fiscal_period where organisation_id = $1 and starts_on = $2`,
          [tenantId, period.startsOn],
        );
        periodId = existing.rows[0]?.id;
      }
      if (!periodId) throw new Error(`period ${period.startsOn} could not be created or found`);
      periodIds.push(periodId);
    }

    const accounts = await seedChartOfAccounts(tx, tenantId);
    const policies = await seedPostingPolicies(tx, tenantId);

    await tx.query(
      `insert into accounting_setting (organisation_id) values ($1)
       on conflict (organisation_id) do nothing`,
      [tenantId],
    );

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

