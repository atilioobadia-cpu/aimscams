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
  { code: '2', name: 'Liabilities and Owners Equity', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: undefined, assumption: undefined },
  { code: '3', name: 'Capital Account', type: 'equity', normalBalance: 'credit', isGroup: true, parentCode: undefined, assumption: undefined },
  { code: '4', name: 'Incomes', type: 'income', normalBalance: 'credit', isGroup: true, parentCode: undefined, assumption: undefined },
  { code: '5', name: 'Expenses', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: undefined, assumption: undefined },
  { code: '1000', name: 'CASH AND CASH EQUIVALENTS', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1001', name: 'AIMSCAMS', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1000', assumption: undefined },
  { code: '1002', name: 'Cash on Hand', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1000', assumption: undefined },
  { code: '1003', name: 'BANK CRDB', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1000', assumption: undefined },
  { code: '1005', name: 'BANK NMB', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1000', assumption: undefined },
  { code: '1010', name: 'TELLERS', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1000', assumption: undefined },
  { code: '1011', name: 'Teller 2', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1010', assumption: undefined },
  { code: '1012', name: 'Teller 1', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1010', assumption: undefined },
  { code: '1100', name: 'SHORT TERM INVESTMENTS', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1200', name: 'TOTAL LOANS', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1201', name: 'ASSET LOAN', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1200', assumption: undefined },
  { code: '1202', name: 'EMERGENCY LOAN', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1200', assumption: undefined },
  { code: '1203', name: 'BUSINESS LOAN', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1200', assumption: undefined },
  { code: '1204', name: 'HOUSING LOAN', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1200', assumption: undefined },
  { code: '1205', name: 'STAFF LOAN', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1200', assumption: undefined },
  { code: '1206', name: 'SUSPENSE ON LOAN', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1200', assumption: undefined },
  { code: '1300', name: 'CUMULATIVE LOAN LOSSES', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1400', name: 'INTEREST AND EXPECTED FEES', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1500', name: 'CURRENT ASSETS', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1501', name: 'Prepaid Corporate Tax', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1500', assumption: undefined },
  { code: '1502', name: 'Loan Processing Fees Receivable', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1500', assumption: undefined },
  { code: '1503', name: 'Staff Advances/Receivables', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1500', assumption: undefined },
  { code: '1504', name: 'Prepaid Expenses', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1500', assumption: undefined },
  { code: '1505', name: 'Interest Receivable', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1500', assumption: undefined },
  { code: '1600', name: 'LONG - TERM INVESTMENTS', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1700', name: 'NON-CURRENT ASSETS', type: 'asset', normalBalance: 'debit', isGroup: true, parentCode: '1', assumption: undefined },
  { code: '1701', name: 'Furniture & Fittings', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1700', assumption: undefined },
  { code: '1702', name: 'Office Equipment', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1700', assumption: undefined },
  { code: '1703', name: 'Motorbikes for Agents', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1700', assumption: undefined },
  { code: '1704', name: 'GPS Trackers', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1700', assumption: undefined },
  { code: '1705', name: 'Fireproof Safe & Cabinets', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1700', assumption: undefined },
  { code: '1706', name: 'Software Licenses', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1700', assumption: undefined },
  { code: '1707', name: 'Leasehold Improvements', type: 'asset', normalBalance: 'debit', isGroup: false, parentCode: '1700', assumption: undefined },
  { code: '2000', name: 'CURRENT LIABILITIES', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '2001', name: 'Tax Payable (Current tax liabilities)', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2002', name: 'AIMSCAMS Charges', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2003', name: 'Insurance premiums', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2004', name: 'Overpayments', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2005', name: 'Accounts Payable', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2006', name: 'Staff Salaries Payable', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2007', name: 'Interest Payable to Lenders', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2008', name: 'Deferred Loan Income', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2009', name: 'Accrued Expenses', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2010', name: 'Down Payment', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2011', name: 'Tax Payable', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2000', assumption: undefined },
  { code: '2100', name: 'INTEREST DEBTS', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '2200', name: 'MEMBERS SAVINGS AND DEPOSITS', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '2300', name: 'SHORT - TERM LOANS', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '2400', name: 'LONG - TERM LOANS', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '2401', name: 'Long-term Loans from Lenders', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2400', assumption: undefined },
  { code: '2500', name: 'UNPAID EXPENSES', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '2501', name: 'Accumulated depreciation', type: 'liability', normalBalance: 'credit', isGroup: false, parentCode: '2500', assumption: undefined },
  { code: '2600', name: 'SUSPENDED INCOME', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '2700', name: 'POSTPONED SUBSIDIES', type: 'liability', normalBalance: 'credit', isGroup: true, parentCode: '2', assumption: undefined },
  { code: '3000', name: 'MEMBERS SHARES', type: 'equity', normalBalance: 'credit', isGroup: true, parentCode: '3', assumption: undefined },
  { code: '3100', name: 'PROFIT/ LOSS', type: 'equity', normalBalance: 'credit', isGroup: true, parentCode: '3', assumption: undefined },
  { code: '3101', name: 'PROFIT AND LOSS A/C', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3100', assumption: undefined },
  { code: '3200', name: 'ACCUMULATION OF PROFIT / LOSS FOR THE RELEVANT YEAR', type: 'equity', normalBalance: 'credit', isGroup: true, parentCode: '3', assumption: undefined },
  { code: '3300', name: 'ACCUMULATION OF PROFIT / LOSS FOR THE PAST YEARS', type: 'equity', normalBalance: 'credit', isGroup: true, parentCode: '3', assumption: undefined },
  { code: '3400', name: "CHANGE OF OWNER'S EQUITY", type: 'equity', normalBalance: 'credit', isGroup: true, parentCode: '3', assumption: undefined },
  { code: '3401', name: 'Education Fund', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3402', name: 'Statutory Reserve Funds', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3403', name: 'Share Transfer Fund', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3404', name: 'Share Capital', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3405', name: 'Retained Earning', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3406', name: 'Grants', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3407', name: 'Insurance Fund', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3408', name: 'Revaluation Reserves', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '3409', name: 'Bad And Doubtful Debts Provision', type: 'equity', normalBalance: 'credit', isGroup: false, parentCode: '3400', assumption: undefined },
  { code: '4000', name: 'INTEREST INCOME', type: 'income', normalBalance: 'credit', isGroup: true, parentCode: '4', assumption: undefined },
  { code: '4001', name: 'INTEREST INCOME ON ASSET LOAN', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4000', assumption: undefined },
  { code: '4002', name: 'INTEREST INCOME ON EMERGENCY LOAN', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4000', assumption: undefined },
  { code: '4003', name: 'INTEREST INCOME ON HOUSING LOAN', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4000', assumption: undefined },
  { code: '4004', name: 'INTEREST INCOME ON BUSINESS LOAN', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4000', assumption: undefined },
  { code: '4005', name: 'INTEREST INCOME ON STAFF LOAN', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4000', assumption: undefined },
  { code: '4100', name: 'OTHER INCOME FROM LOANS', type: 'income', normalBalance: 'credit', isGroup: true, parentCode: '4', assumption: undefined },
  { code: '4101', name: 'LOAN MANAGEMENT FEE', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4100', assumption: undefined },
  { code: '4102', name: 'DEVICE TRACKING FEE', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4100', assumption: undefined },
  { code: '4103', name: 'LOAN RESTRUCTURING FEE', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4100', assumption: undefined },
  { code: '4104', name: 'LOAN PENALTY', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4100', assumption: undefined },
  { code: '4200', name: 'OTHER INCOME', type: 'income', normalBalance: 'credit', isGroup: true, parentCode: '4', assumption: undefined },
  { code: '4201', name: 'Insurance Commision', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4200', assumption: undefined },
  { code: '4202', name: 'Income from Sale of Repossessed Assets', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4200', assumption: undefined },
  { code: '4203', name: 'Subscription Fees', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4200', assumption: undefined },
  { code: '4204', name: 'Other Operational Income', type: 'income', normalBalance: 'credit', isGroup: false, parentCode: '4200', assumption: undefined },
  { code: '4300', name: 'INCOME TO GENERATE INVESTMENTS', type: 'income', normalBalance: 'credit', isGroup: true, parentCode: '4', assumption: undefined },
  { code: '4400', name: 'SUBSIDIES', type: 'income', normalBalance: 'credit', isGroup: true, parentCode: '4', assumption: undefined },
  { code: '4500', name: 'OTHER REVENUES', type: 'income', normalBalance: 'credit', isGroup: true, parentCode: '4', assumption: undefined },
  { code: '5000', name: 'LOAN EXPENSES', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5001', name: 'Tracker Device Purchase & Installation', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5000', assumption: undefined },
  { code: '5002', name: 'Field Transport (Loan Monitoring)', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5000', assumption: undefined },
  { code: '5003', name: 'Loan Loss Provision', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5000', assumption: undefined },
  { code: '5004', name: 'Write-off – Bad Loans', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5000', assumption: undefined },
  { code: '5005', name: 'Fuel – Motorbikes', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5000', assumption: undefined },
  { code: '5100', name: 'HR & DEVELOPMENT', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5101', name: 'Subscriptions', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5102', name: 'Training & Team Building', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5103', name: 'Consultancy Fees', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5104', name: 'Director’s Fees', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5105', name: 'Volunteers/Ambassadors Stipends', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5106', name: 'NHIF Medical Insurance', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5107', name: 'Repairs & Maintenance', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5108', name: 'Board Expenses', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5109', name: 'Tea/Coffee & Staff Meals', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5100', assumption: undefined },
  { code: '5200', name: 'ADMINISTRATIVE COSTS', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5201', name: 'Salaries & Wages – All Staff', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5202', name: 'Rent', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5203', name: 'Utilities (Electricity, Water)', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5204', name: 'Internet & Communications', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5205', name: 'Stationery & Printing', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5206', name: 'Cleaning Services', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5207', name: 'Advertising & Promotion', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5208', name: 'Office Supplies', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5209', name: 'Professional Fees', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5210', name: 'Insurance', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5211', name: 'License & Regulatory Fees', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5212', name: 'Software Subscription & Maintenance', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5213', name: 'Current year depreciation', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5214', name: 'Travelling Allowance and Accomodation', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5215', name: 'Marketing and Advertisement', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5216', name: 'NSSF Contribution', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5217', name: 'S/Duty Lease', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5200', assumption: undefined },
  { code: '5300', name: 'BUSINESS COSTS', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5400', name: 'EQUIPMENT COSTS', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5401', name: 'Current year depreciation', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5400', assumption: undefined },
  { code: '5500', name: 'OTHER COSTS', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5501', name: 'AIMSCAMS Fees', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5500', assumption: undefined },
  { code: '5502', name: 'BANK CHARGES', type: 'expense', normalBalance: 'debit', isGroup: false, parentCode: '5500', assumption: undefined },
  { code: '5600', name: 'OFFICE COSTS', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5700', name: 'ESTATE EXPENSES', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5800', name: 'TRAVEL COSTS', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
  { code: '5900', name: 'SYSTEM COSTS', type: 'expense', normalBalance: 'debit', isGroup: true, parentCode: '5', assumption: undefined },
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

