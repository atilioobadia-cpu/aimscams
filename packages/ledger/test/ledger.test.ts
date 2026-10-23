import { afterEach, describe, expect, it } from 'vitest';

import { fromMajor } from '@aimscams/domain';

import {
  accountBalance,
  CHART_OF_ACCOUNTS,
  createDatabase,
  POSTING_POLICIES,
  postEntry,
  postEvent,
  provisionTenant,
  seedChartOfAccounts,
  seedPostingPolicies,
  trialBalance,
  type Db,
} from '../src/index.js';

const TENANT = '00000000-0000-0000-0000-000000000001';
const OTHER = '00000000-0000-0000-0000-000000000002';

let open: Db | undefined;

afterEach(async () => {
  await open?.close();
  open = undefined;
});

async function bootstrap(): Promise<Db> {
  const db = await createDatabase();
  open = db;

  await db.exec(`
    insert into tenant (id, code, name, dialect) values
      ('${TENANT}', 'T1', 'Test SACCO', 'SACCOS'),
      ('${OTHER}', 'T2', 'Other SACCO', 'SACCOS');

    insert into fiscal_period (tenant_id, starts_on, ends_on) values
      ('${TENANT}', '2026-10-01', '2026-10-31'),
      ('${OTHER}', '2026-10-01', '2026-10-31');
  `);

  await seedChartOfAccounts(db, TENANT);
  await seedPostingPolicies(db, TENANT);
  await seedChartOfAccounts(db, OTHER);
  await seedPostingPolicies(db, OTHER);

  return db;
}

async function periodId(db: Db, tenantId: string): Promise<string> {
  const result = await db.query<{ id: string }>(
    `select id from fiscal_period where tenant_id = $1 limit 1`,
    [tenantId],
  );
  const id = result.rows[0]?.id;
  if (!id) throw new Error('no period');
  return id;
}

async function accountId(db: Db, tenantId: string, code: string): Promise<string> {
  const result = await db.query<{ id: string }>(
    `select id from gl_account where tenant_id = $1 and code = $2`,
    [tenantId, code],
  );
  const id = result.rows[0]?.id;
  if (!id) throw new Error(`no account ${code}`);
  return id;
}

async function deposit(db: Db, tenantId: string, major: string, key: string): Promise<void> {
  await postEvent(db, {
    tenantId,
    entryDate: '2026-10-05',
    eventCode: 'SAVINGS_DEPOSIT',
    sourceType: 'savings',
    sourceId: key,
    idempotencyKey: key,
    amounts: { total: fromMajor(major) },
  });
}

describe('the database enforces the ledger', () => {
  it('refuses an unbalanced entry at commit', async () => {
    const db = await bootstrap();
    const period = await periodId(db, TENANT);
    const cash = await accountId(db, TENANT, '1002');
    const savings = await accountId(db, TENANT, '2101');

    await expect(
      db.transaction(async (tx) => {
        const entry = await tx.query<{ id: string }>(
          `insert into journal_entry
             (tenant_id, entry_date, period_id, event_code, source_type, source_id)
           values ($1, '2026-10-05', $2, 'TEST', 'test', 'unbalanced')
           returning id`,
          [TENANT, period],
        );
        const id = entry.rows[0]?.id;
        if (!id) throw new Error('no entry');

        await tx.query(
          `insert into journal_line
             (tenant_id, entry_id, line_no, account_id, debit_minor, credit_minor)
           values ($1, $2, 1, $3, 10000, 0),
                  ($1, $2, 2, $4, 0, 9000)`,
          [TENANT, id, cash, savings],
        );
      }),
    ).rejects.toThrow(/unbalanced/);
  });

  it('refuses an entry with a single line', async () => {
    const db = await bootstrap();
    const period = await periodId(db, TENANT);
    const cash = await accountId(db, TENANT, '1002');

    await expect(
      db.transaction(async (tx) => {
        const entry = await tx.query<{ id: string }>(
          `insert into journal_entry
             (tenant_id, entry_date, period_id, event_code, source_type, source_id)
           values ($1, '2026-10-05', $2, 'TEST', 'test', 'lonely')
           returning id`,
          [TENANT, period],
        );
        const id = entry.rows[0]?.id;
        if (!id) throw new Error('no entry');

        await tx.query(
          `insert into journal_line
             (tenant_id, entry_id, line_no, account_id, debit_minor, credit_minor)
           values ($1, $2, 1, $3, 10000, 0)`,
          [TENANT, id, cash],
        );
      }),
    ).rejects.toThrow(/at least two/);
  });

  it('refuses a line that is both debit and credit, or neither', async () => {
    const db = await bootstrap();
    const period = await periodId(db, TENANT);
    const cash = await accountId(db, TENANT, '1002');

    const bothSides = async (debit: number, credit: number) =>
      db.transaction(async (tx) => {
        const entry = await tx.query<{ id: string }>(
          `insert into journal_entry
             (tenant_id, entry_date, period_id, event_code, source_type, source_id)
           values ($1, '2026-10-05', $2, 'TEST', 'test', 'sides')
           returning id`,
          [TENANT, period],
        );
        const id = entry.rows[0]?.id;
        if (!id) throw new Error('no entry');

        await tx.query(
          `insert into journal_line
             (tenant_id, entry_id, line_no, account_id, debit_minor, credit_minor)
           values ($1, $2, 1, $3, $4, $5)`,
          [TENANT, id, cash, debit, credit],
        );
      });

    await expect(bothSides(100, 100)).rejects.toThrow(/check/i);
    await expect(bothSides(0, 0)).rejects.toThrow(/check/i);
  });

  it('refuses to modify or delete a posted entry', async () => {
    const db = await bootstrap();
    await deposit(db, TENANT, '1000.00', 'immutability');

    const posted = await db.query<{ id: string }>(
      `select id from journal_entry where tenant_id = $1 and idempotency_key = $2`,
      [TENANT, 'immutability'],
    );
    const id = posted.rows[0]?.id;
    if (!id) throw new Error('no entry');

    await expect(
      db.query(`update journal_entry set description = 'changed' where id = $1`, [id]),
    ).rejects.toThrow(/posted/);

    await expect(db.query(`delete from journal_entry where id = $1`, [id])).rejects.toThrow(
      /posted/,
    );

    await expect(
      db.query(`update journal_line set debit_minor = 1 where entry_id = $1`, [id]),
    ).rejects.toThrow(/immutable/);

    await expect(db.query(`delete from journal_line where entry_id = $1`, [id])).rejects.toThrow(
      /immutable/,
    );
  });

  it('refuses to post into a closed period', async () => {
    const db = await bootstrap();
    await db.query(`update fiscal_period set status = 'closed' where tenant_id = $1`, [TENANT]);

    await expect(deposit(db, TENANT, '1000.00', 'closed')).rejects.toThrow(/closed/);
  });

  it('refuses an entry dated outside its period', async () => {
    const db = await bootstrap();

    await expect(
      postEntry(db, {
        tenantId: TENANT,
        entryDate: '2026-11-02',
        eventCode: 'FEE_INCOME',
        sourceType: 'test',
        sourceId: 'late',
        lines: [
          { account: '1002', debitMinor: 100n },
          { account: '4101', creditMinor: 100n },
        ],
      }),
    ).rejects.toThrow(/no fiscal period covers/);
  });

  it('refuses an account that is not in the chart', async () => {
    const db = await bootstrap();

    await expect(
      postEntry(db, {
        tenantId: TENANT,
        entryDate: '2026-10-05',
        eventCode: 'TEST',
        sourceType: 'test',
        sourceId: 'missing-account',
        lines: [
          { account: '1002', debitMinor: 100n },
          { account: '9999', creditMinor: 100n },
        ],
      }),
    ).rejects.toThrow(/not in the chart of accounts/);
  });

  it('returns the original entry for a repeated idempotency key', async () => {
    const db = await bootstrap();

    const first = await postEvent(db, {
      tenantId: TENANT,
      entryDate: '2026-10-05',
      eventCode: 'SAVINGS_DEPOSIT',
      sourceType: 'savings',
      sourceId: 'duplicate',
      idempotencyKey: 'duplicate',
      amounts: { total: fromMajor('1000.00') },
    });

    const second = await postEvent(db, {
      tenantId: TENANT,
      entryDate: '2026-10-05',
      eventCode: 'SAVINGS_DEPOSIT',
      sourceType: 'savings',
      sourceId: 'duplicate',
      idempotencyKey: 'duplicate',
      amounts: { total: fromMajor('1000.00') },
    });

    expect(second.id).toBe(first.id);
    expect(second.reused).toBe(true);

    const count = await db.query<{ count: unknown }>(
      `select count(*) as count from journal_entry where tenant_id = $1`,
      [TENANT],
    );
    expect(Number(count.rows[0]?.count)).toBe(1);
  });
});

describe('provisioning', () => {
  it('creates a usable book, and a retry does not create a second one', async () => {
    const db = await createDatabase();
    open = db;

    const input = {
      code: 'DEMO1',
      name: 'AIMS Demo SACCO',
      dialect: 'SACCOS' as const,
      branch: { code: 'HQ', name: 'Head office', councilType: 'MC' as const },
      periods: [{ startsOn: '2026-01-01', endsOn: '2026-12-31' }],
    };

    const first = await provisionTenant(db, input);
    expect(first.reused).toBe(false);
    expect(first.accounts).toBe(CHART_OF_ACCOUNTS.length);
    expect(first.policies).toBe(POSTING_POLICIES.length);
    expect(first.periodIds).toHaveLength(1);

    const second = await provisionTenant(db, input);
    expect(second.reused).toBe(true);
    expect(second.tenantId).toBe(first.tenantId);
    expect(second.periodIds[0]).toBe(first.periodIds[0]);
    expect(second.accounts).toBe(0);
    expect(second.policies).toBe(0);

    const branch = await db.query<{ council_type: string }>(
      `select council_type from branch where id = $1`,
      [first.branchId],
    );
    expect(branch.rows[0]?.council_type).toBe('MC');

    const balance = await trialBalance(db, first.tenantId, '2026-12-31');
    expect(balance.rows).toHaveLength(CHART_OF_ACCOUNTS.length);
    expect(balance.debitMinor).toBe(0n);
    expect(balance.creditMinor).toBe(0n);

    await postEvent(db, {
      tenantId: first.tenantId,
      entryDate: '2026-03-01',
      eventCode: 'SAVINGS_DEPOSIT',
      sourceType: 'savings',
      sourceId: 'opening',
      amounts: { total: fromMajor('250.00') },
    });

    expect(await accountBalance(db, first.tenantId, '2101', '2026-12-31')).toBe(
      fromMajor('250.00').minor,
    );
  });

  it('refuses overlapping fiscal periods', async () => {
    const db = await createDatabase();
    open = db;

    await expect(
      provisionTenant(db, {
        code: 'DEMO2',
        name: 'AIMS Demo Two',
        dialect: 'MFI',
        periods: [
          { startsOn: '2026-01-01', endsOn: '2026-12-31' },
          { startsOn: '2026-06-01', endsOn: '2027-05-31' },
        ],
      }),
    ).rejects.toThrow(/overlap/);
  });
});

describe('a scripted week ties out', () => {
  it('produces a trial balance where debits equal credits', async () => {
    const db = await bootstrap();

    const post = (
      entryDate: string,
      eventCode: string,
      sourceId: string,
      amounts: Parameters<typeof postEvent>[1]['amounts'],
    ) =>
      postEvent(db, {
        tenantId: TENANT,
        entryDate,
        eventCode,
        sourceType: eventCode.toLowerCase(),
        sourceId,
        idempotencyKey: `${eventCode}:${sourceId}`,
        amounts,
      });

    // Monday: a member deposits 5,000.
    await post('2026-10-05', 'SAVINGS_DEPOSIT', 'w1', { total: fromMajor('5000.00') });
    // Tuesday: a loan of 3,000 is disbursed.
    await post('2026-10-06', 'LOAN_DISBURSEMENT', 'w2', { total: fromMajor('3000.00') });
    // Wednesday: a repayment of 1,200 — 1,000 principal, 200 interest.
    await post('2026-10-07', 'LOAN_REPAYMENT', 'w3', {
      total: fromMajor('1200.00'),
      principal: fromMajor('1000.00'),
      interest: fromMajor('200.00'),
    });
    // Thursday: a 100 fee is collected.
    await post('2026-10-08', 'FEE_INCOME', 'w4', { total: fromMajor('100.00') });
    // Friday: a member withdraws 500.
    await post('2026-10-09', 'SAVINGS_WITHDRAWAL', 'w5', { total: fromMajor('500.00') });

    const balance = await trialBalance(db, TENANT, '2026-10-31');

    expect(balance.debitMinor).toBe(balance.creditMinor);
    expect(balance.debitMinor).toBe(fromMajor('9800.00').minor);

    expect(await accountBalance(db, TENANT, '1002', '2026-10-31')).toBe(
      fromMajor('2800.00').minor,
    );
    expect(await accountBalance(db, TENANT, '1201', '2026-10-31')).toBe(
      fromMajor('2000.00').minor,
    );
    expect(await accountBalance(db, TENANT, '2101', '2026-10-31')).toBe(
      fromMajor('4500.00').minor,
    );
    expect(await accountBalance(db, TENANT, '4001', '2026-10-31')).toBe(
      fromMajor('200.00').minor,
    );
    expect(await accountBalance(db, TENANT, '4101', '2026-10-31')).toBe(
      fromMajor('100.00').minor,
    );
  });

  it('ignores entries dated after the report date', async () => {
    const db = await bootstrap();
    await deposit(db, TENANT, '1000.00', 'early');

    await postEvent(db, {
      tenantId: TENANT,
      entryDate: '2026-10-20',
      eventCode: 'SAVINGS_DEPOSIT',
      sourceType: 'savings',
      sourceId: 'late',
      amounts: { total: fromMajor('2000.00') },
    });

    const early = await trialBalance(db, TENANT, '2026-10-10');
    expect(await accountBalance(db, TENANT, '1002', '2026-10-10')).toBe(
      fromMajor('1000.00').minor,
    );
    expect(early.debitMinor).toBe(early.creditMinor);

    const all = await accountBalance(db, TENANT, '1002', '2026-10-31');
    expect(all).toBe(fromMajor('3000.00').minor);
  });
});

describe('tenants are isolated', () => {
  it('shows each tenant only its own entries under row-level security', async () => {
    const db = await bootstrap();

    await deposit(db, TENANT, '1000.00', 'a');
    await deposit(db, OTHER, '2000.00', 'b');

    await db.exec(`
      create role app_user nologin;
      grant usage on schema public to app_user;
      grant select on all tables in schema public to app_user;
    `);

    await db.exec(`set role app_user`);
    await db.exec(`set app.tenant_id = '${TENANT}'`);

    const mine = await db.query<{ count: unknown }>(`select count(*) as count from journal_entry`);
    expect(Number(mine.rows[0]?.count)).toBe(1);

    const lines = await db.query<{ count: unknown }>(`select count(*) as count from journal_line`);
    expect(Number(lines.rows[0]?.count)).toBe(2);

    const amounts = await db.query<{ total: unknown }>(
      `select coalesce(sum(debit_minor), 0) as total from journal_line`,
    );
    expect(BigInt(amounts.rows[0]?.total as bigint)).toBe(fromMajor('1000.00').minor);

    await db.exec(`set app.tenant_id = '${OTHER}'`);
    const theirs = await db.query<{ count: unknown }>(`select count(*) as count from journal_entry`);
    expect(Number(theirs.rows[0]?.count)).toBe(1);

    await db.exec(`reset role`);

    const all = await db.query<{ count: unknown }>(`select count(*) as count from journal_entry`);
    expect(Number(all.rows[0]?.count)).toBe(2);
  });
});
