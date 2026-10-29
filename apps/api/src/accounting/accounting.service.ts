import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { fromMajor } from '@aimscams/domain';
import { Prisma } from '@aimscams/db';
import {
  createDraft,
  createPostedEntry,
  getEntry,
  ledgerEntries,
  LedgerError,
  listEntries,
  postDraft,
  reverseEntry,
  trialBalance,
  type EntryFilter,
  type LedgerFilter,
} from '@aimscams/ledger';

import { AuditService } from '../auth/audit.service.js';
import type { AuthContext } from '../auth/auth.types.js';
import { AccountingDbService } from './accounting-db.service.js';
import { PRISMA } from '../prisma/prisma.module.js';
import type { PrismaClient } from '@aimscams/db';

interface MutationContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface PolicyLineInput {
  account: string;
  side: 'debit' | 'credit';
  amount: 'total' | 'principal' | 'interest' | 'penalty' | 'charges';
}

const AMOUNT_KEYS: readonly PolicyLineInput['amount'][] = [
  'total',
  'principal',
  'interest',
  'penalty',
  'charges',
];

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestException(`${field} is required.`);
  }
  return value.trim();
}

function date(value: unknown, field: string): string {
  const raw = text(value, field);
  if (!DATE.test(raw) || Number.isNaN(Date.parse(`${raw}T00:00:00Z`))) {
    throw new BadRequestException(`${field} must be a date (YYYY-MM-DD).`);
  }
  return raw;
}

function money(value: unknown, field: string): bigint {
  if (value === null || value === undefined || value === '') return 0n;
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new BadRequestException(`${field} must be an amount.`);
  }
  try {
    return fromMajor(value).minor;
  } catch {
    throw new BadRequestException(`${field} must be an amount with at most two decimals.`);
  }
}

function mapLedgerError(error: unknown): never {
  if (error instanceof LedgerError) {
    if (error.code === 'not_found') throw new NotFoundException(error.message);
    if (error.code === 'conflict') throw new ConflictException(error.message);
    throw new BadRequestException(error.message);
  }
  if (error instanceof Error) {
    if (/no fiscal period covers/.test(error.message)) {
      throw new BadRequestException(error.message);
    }
    if (/unbalanced|at least two|exactly one|not in the chart|cannot be modified|is closed|outside period|immutable/.test(error.message)) {
      throw new BadRequestException(error.message);
    }
  }
  throw error;
}

@Injectable()
export class AccountingService {
  constructor(
    private readonly dbService: AccountingDbService,
    private readonly audit: AuditService,
    @Inject(PRISMA) private readonly prisma: PrismaClient,
  ) {}

  async getChartOfAccounts(organisationId: string) {
    const db = await this.dbService.getDb(organisationId);
    try {
      const result = await db.query<{
        id: string;
        code: string;
        name: string;
        type: string;
        normal_balance: string;
        is_postable: boolean;
        is_assumption: boolean;
      }>(
        `select id, code, name, type, normal_balance, is_postable, is_assumption
         from gl_account where organisation_id = $1 order by code`,
        [organisationId],
      );
      return result.rows;
    } finally {
      await db.close();
    }
  }

  async listAssetTypes(organisationId: string) {
    return this.prisma.assetType.findMany({
      where: { organisationId },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
  }

  async createAssetType(organisationId: string, body: Record<string, unknown>) {
    const code = String(body.code ?? '').trim().toUpperCase();
    const name = String(body.name ?? '').trim();
    if (!code || !name) throw new BadRequestException('Code and name are required.');
    const method = String(body.depreciationMethod ?? 'STRAIGHT_LINE').trim().toUpperCase();
    const life = Number(body.usefulLifeMonths ?? 0);
    if (!Number.isInteger(life) || life < 0) throw new BadRequestException('Useful life must be a whole number.');
    return this.prisma.assetType.create({
      data: {
        organisationId,
        code,
        name,
        description: body.description ? String(body.description).trim() : null,
        depreciationMethod: method,
        usefulLifeMonths: life,
        status: 'ACTIVE',
      },
    });
  }

  async getTrialBalance(organisationId: string, asOf: string) {
    const db = await this.dbService.getDb(organisationId);
    try {
      const report = await trialBalance(db, organisationId, asOf);
      return {
        asOf: report.asOf,
        debitMinor: report.debitMinor.toString(),
        creditMinor: report.creditMinor.toString(),
        rows: report.rows.map((row) => ({
          ...row,
          debitMinor: row.debitMinor.toString(),
          creditMinor: row.creditMinor.toString(),
          balanceMinor: row.balanceMinor.toString(),
        })),
      };
    } finally {
      await db.close();
    }
  }

  // -------------------------------------------------------------------------
  // ST-02 Accounting settings
  // -------------------------------------------------------------------------

  async getSettings(organisationId: string) {
    const db = await this.dbService.getDb(organisationId);
    try {
      const organisation = await db.query<{
        id: string;
        code: string;
        name: string;
        dialect: string;
      }>(`select id, code, name, dialect from organisation where id = $1`, [organisationId]);

      await db.query(
        `insert into accounting_setting (organisation_id) values ($1)
         on conflict (organisation_id) do nothing`,
        [organisationId],
      );

      const settings = await db.query<{
        taxRateBp: number;
        interBranchEnabled: boolean;
        updatedAt: string;
      }>(
        `select tax_rate_bp as "taxRateBp", inter_branch_enabled as "interBranchEnabled",
                updated_at as "updatedAt"
           from accounting_setting where organisation_id = $1`,
        [organisationId],
      );

      const periods = await db.query<{
        id: string;
        startsOn: string;
        endsOn: string;
        status: 'open' | 'closed';
      }>(
        `select id, to_char(starts_on, 'YYYY-MM-DD') as "startsOn",
                to_char(ends_on, 'YYYY-MM-DD') as "endsOn", status
           from fiscal_period where organisation_id = $1 order by starts_on desc`,
        [organisationId],
      );

      const policies = await this.latestPolicies(db, organisationId);

      const accounts = await db.query<{
        id: string;
        code: string;
        name: string;
        type: string;
        normalBalance: string;
        isPostable: boolean;
        isAssumption: boolean;
      }>(
        `select id, code, name, type, normal_balance as "normalBalance",
                is_postable as "isPostable", is_assumption as "isAssumption"
           from gl_account where organisation_id = $1 order by code`,
        [organisationId],
      );

      return {
        organisation: organisation.rows[0] ?? null,
        settings: settings.rows[0] ?? {
          taxRateBp: 0,
          interBranchEnabled: false,
          updatedAt: null,
        },
        periods: periods.rows,
        policies: policies.rows,
        accounts: accounts.rows,
      };
    } finally {
      await db.close();
    }
  }

  async updateSettings(
    auth: AuthContext,
    body: Record<string, unknown>,
    context: MutationContext,
  ) {
    const organisationId = auth.user.organisation.id;
    const taxRateBp = body.taxRateBp;
    const interBranchEnabled = body.interBranchEnabled;

    if (!Number.isInteger(taxRateBp) || (taxRateBp as number) < 0 || (taxRateBp as number) > 10000) {
      throw new BadRequestException('Tax rate must be a whole percentage between 0 and 100.');
    }
    if (typeof interBranchEnabled !== 'boolean') {
      throw new BadRequestException('Inter-branch ledger must be on or off.');
    }

    const db = await this.dbService.getDb(organisationId);
    try {
      const before = await db.query(`select * from accounting_setting where organisation_id = $1`, [
        organisationId,
      ]);

      await db.query(
        `insert into accounting_setting (organisation_id, tax_rate_bp, inter_branch_enabled, updated_at)
         values ($1, $2, $3, now())
         on conflict (organisation_id) do update
           set tax_rate_bp = excluded.tax_rate_bp,
               inter_branch_enabled = excluded.inter_branch_enabled,
               updated_at = now()`,
        [organisationId, taxRateBp, interBranchEnabled],
      );

      await this.audit.record({
        organisationId,
        actorUserId: auth.user.id,
        actorLabel: auth.user.email,
        action: 'Accounting settings updated',
        entityType: 'Accounting Setting',
        entityId: organisationId,
        before: { row: before.rows[0] ?? null } as Prisma.InputJsonValue,
        after: { taxRateBp: taxRateBp as number, interBranchEnabled },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return { taxRateBp, interBranchEnabled };
    } finally {
      await db.close();
    }
  }

  async createPeriod(
    auth: AuthContext,
    body: Record<string, unknown>,
    context: MutationContext,
  ) {
    const organisationId = auth.user.organisation.id;
    const startsOn = date(body.startsOn, 'Start date');
    const endsOn = date(body.endsOn, 'End date');

    if (endsOn <= startsOn) {
      throw new BadRequestException('End date must fall after the start date.');
    }

    const db = await this.dbService.getDb(organisationId);
    try {
      const overlap = await db.query<{ id: string }>(
        `select id from fiscal_period
          where organisation_id = $1
            and starts_on <= $2::date and ends_on >= $3::date
          limit 1`,
        [organisationId, endsOn, startsOn],
      );
      if (overlap.rows[0]) {
        throw new ConflictException('That period overlaps an existing fiscal period.');
      }

      const created = await db.query<{
        id: string;
        startsOn: string;
        endsOn: string;
        status: string;
      }>(
        `insert into fiscal_period (organisation_id, starts_on, ends_on)
         values ($1, $2, $3)
         returning id, to_char(starts_on, 'YYYY-MM-DD') as "startsOn",
                   to_char(ends_on, 'YYYY-MM-DD') as "endsOn", status`,
        [organisationId, startsOn, endsOn],
      );

      const period = created.rows[0];
      if (!period) throw new BadRequestException('The period was not created.');

      await this.audit.record({
        organisationId,
        actorUserId: auth.user.id,
        actorLabel: auth.user.email,
        action: 'Fiscal period created',
        entityType: 'Accounting Period',
        entityId: period.id,
        after: { startsOn, endsOn },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return period;
    } finally {
      await db.close();
    }
  }

  async updatePeriod(
    auth: AuthContext,
    periodId: string,
    body: Record<string, unknown>,
    context: MutationContext,
  ) {
    const organisationId = auth.user.organisation.id;
    const status = body.status;

    if (status !== 'open' && status !== 'closed') {
      throw new BadRequestException('Status must be open or closed.');
    }

    const db = await this.dbService.getDb(organisationId);
    try {
      const found = await db.query<{ id: string; status: string }>(
        `select id, status from fiscal_period where organisation_id = $1 and id = $2`,
        [organisationId, periodId],
      );
      const period = found.rows[0];
      if (!period) throw new NotFoundException('Fiscal period not found.');

      if (status === 'closed') {
        const drafts = await db.query<{ count: unknown }>(
          `select count(*) as count from journal_entry
            where organisation_id = $1 and period_id = $2 and status = 'draft'`,
          [organisationId, periodId],
        );
        if (Number(drafts.rows[0]?.count ?? 0) > 0) {
          throw new ConflictException('Post or delete every draft in this period before closing it.');
        }
      }

      await db.query(
        `update fiscal_period set status = $3 where organisation_id = $1 and id = $2`,
        [organisationId, periodId, status],
      );

      await this.audit.record({
        organisationId,
        actorUserId: auth.user.id,
        actorLabel: auth.user.email,
        action: status === 'closed' ? 'Fiscal period closed' : 'Fiscal period reopened',
        entityType: 'Accounting Period',
        entityId: periodId,
        before: { status: period.status },
        after: { status },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return { id: periodId, status };
    } finally {
      await db.close();
    }
  }

  async updatePolicy(
    auth: AuthContext,
    eventCode: string,
    body: Record<string, unknown>,
    context: MutationContext,
  ) {
    const organisationId = auth.user.organisation.id;
    const code = eventCode.trim().toUpperCase();
    const lines = this.parsePolicyLines(body.lines);

    const db = await this.dbService.getDb(organisationId);
    try {
      const existing = await db.query<{ version: number }>(
        `select version from posting_policy
          where organisation_id = $1 and event_code = $2
          order by version desc limit 1`,
        [organisationId, code],
      );
      const current = existing.rows[0];
      if (!current) throw new NotFoundException(`No posting policy for ${code}.`);

      const accounts = await db.query<{ code: string; is_postable: boolean }>(
        `select code, is_postable from gl_account
          where organisation_id = $1 and code = any($2::text[])`,
        [organisationId, [...new Set(lines.map((line) => line.account))]],
      );
      const known = new Map(accounts.rows.map((row) => [row.code, row.is_postable]));

      for (const line of lines) {
        if (!known.has(line.account)) {
          throw new BadRequestException(`Account ${line.account} is not in the chart of accounts.`);
        }
        if (!known.get(line.account)) {
          throw new BadRequestException(`Account ${line.account} is not postable.`);
        }
      }

      const nextVersion = Number(current.version) + 1;
      await db.query(
        `insert into posting_policy (organisation_id, event_code, version, lines, note)
         values ($1, $2, $3, $4::jsonb, $5)`,
        [organisationId, code, nextVersion, JSON.stringify(lines), 'Edited from accounting settings'],
      );

      await this.audit.record({
        organisationId,
        actorUserId: auth.user.id,
        actorLabel: auth.user.email,
        action: 'Posting policy updated',
        entityType: 'Posting Policy',
        entityId: `${code}:v${nextVersion}`,
        before: { version: Number(current.version) },
        after: { version: nextVersion, lines } as unknown as Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      const latest = await this.latestPolicies(db, organisationId);
      return latest.rows.find((policy) => policy.eventCode === code) ?? null;
    } finally {
      await db.close();
    }
  }

  // -------------------------------------------------------------------------
  // GL-02 Journal entries
  // -------------------------------------------------------------------------

  async listEntries(organisationId: string, filter: EntryFilter) {
    const db = await this.dbService.getDb(organisationId);
    try {
      const page = await listEntries(db, organisationId, filter);
      return {
        total: page.total,
        entries: page.entries.map((entry) => ({
          ...entry,
          debitMinor: entry.debitMinor.toString(),
          creditMinor: entry.creditMinor.toString(),
        })),
      };
    } finally {
      await db.close();
    }
  }

  async getEntry(organisationId: string, entryId: string) {
    const db = await this.dbService.getDb(organisationId);
    try {
      const entry = await getEntry(db, organisationId, entryId);
      if (!entry) throw new NotFoundException('Journal entry not found.');
      return this.serializeEntry(entry);
    } finally {
      await db.close();
    }
  }

  async createEntry(
    auth: AuthContext,
    body: Record<string, unknown>,
    post: boolean,
    context: MutationContext,
  ) {
    const organisationId = auth.user.organisation.id;
    const input = {
      tenantId: organisationId,
      entryDate: date(body.entryDate, 'Entry date'),
      description: typeof body.description === 'string' ? body.description.trim() : '',
      eventCode: typeof body.eventCode === 'string' ? body.eventCode : 'MANUAL',
      sourceType: 'manual',
      sourceId: `manual:${Date.now()}`,
      lines: this.parseEntryLines(body.lines),
    };

    const db = await this.dbService.getDb(organisationId);
    try {
      const result = post
        ? await createPostedEntry(db, input)
        : await createDraft(db, input);

      await this.audit.record({
        organisationId,
        actorUserId: auth.user.id,
        actorLabel: auth.user.email,
        action: post ? 'Journal entry posted' : 'Journal entry drafted',
        entityType: 'Journal Entry',
        entityId: result.id,
        after: {
          entryNo: result.entryNo,
          entryDate: input.entryDate,
          lines: input.lines.map((line) => ({
            account: line.account,
            debit: (line.debitMinor ?? 0n).toString(),
            credit: (line.creditMinor ?? 0n).toString(),
          })),
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return this.getEntry(organisationId, result.id);
    } catch (error) {
      mapLedgerError(error);
    } finally {
      await db.close();
    }
  }

  async postEntry(auth: AuthContext, entryId: string, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const db = await this.dbService.getDb(organisationId);
    try {
      const result = await postDraft(db, organisationId, entryId);
      await this.audit.record({
        organisationId,
        actorUserId: auth.user.id,
        actorLabel: auth.user.email,
        action: result.reused ? 'Journal entry post repeated' : 'Journal entry posted',
        entityType: 'Journal Entry',
        entityId: entryId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      return this.getEntry(organisationId, entryId);
    } catch (error) {
      mapLedgerError(error);
    } finally {
      await db.close();
    }
  }

  async reverseEntry(
    auth: AuthContext,
    entryId: string,
    body: Record<string, unknown>,
    context: MutationContext,
  ) {
    const organisationId = auth.user.organisation.id;
    const entryDate =
      body.entryDate === undefined
        ? new Date().toISOString().slice(0, 10)
        : date(body.entryDate, 'Reversal date');

    const db = await this.dbService.getDb(organisationId);
    try {
      const result = await reverseEntry(db, entryId, {
        tenantId: organisationId,
        entryDate,
        description: typeof body.description === 'string' ? body.description : undefined,
      });

      await this.audit.record({
        organisationId,
        actorUserId: auth.user.id,
        actorLabel: auth.user.email,
        action: result.reused ? 'Journal entry reversal repeated' : 'Journal entry reversed',
        entityType: 'Journal Entry',
        entityId: entryId,
        after: { reversalEntryId: result.id, entryDate },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return this.getEntry(organisationId, result.id);
    } catch (error) {
      mapLedgerError(error);
    } finally {
      await db.close();
    }
  }

  // -------------------------------------------------------------------------
  // GL-03 Ledger entries
  // -------------------------------------------------------------------------

  async getLedger(organisationId: string, filter: LedgerFilter) {
    const db = await this.dbService.getDb(organisationId);
    try {
      const page = await ledgerEntries(db, organisationId, filter);
      return {
        account: page.account,
        openingMinor: page.openingMinor.toString(),
        closingMinor: page.closingMinor.toString(),
        total: page.total,
        rows: page.rows.map((row) => ({
          ...row,
          debitMinor: row.debitMinor.toString(),
          creditMinor: row.creditMinor.toString(),
          runningMinor: row.runningMinor.toString(),
        })),
      };
    } catch (error) {
      mapLedgerError(error);
    } finally {
      await db.close();
    }
  }

  // -------------------------------------------------------------------------
  // Outbox health (Slice 4)
  // -------------------------------------------------------------------------

  async getOutboxStatus(organisationId: string) {
    const db = await this.dbService.getDb(organisationId);
    try {
      const counts = await db.query<{ status: string; count: number }>(
        `select status, count(*)::int as count
           from outbox_event
          where organisation_id = $1
          group by status`,
        [organisationId],
      );

      const due = await db.query<{ oldest: Date | string | null }>(
        `select min(available_at) as oldest
           from outbox_event
          where organisation_id = $1 and status in ('pending', 'processing')`,
        [organisationId],
      );

      const dead = await db.query<{
        id: string;
        eventType: string;
        attempts: number;
        lastError: string | null;
        createdAt: Date | string;
      }>(
        `select id, event_type as "eventType", attempts, last_error as "lastError",
                created_at as "createdAt"
           from outbox_event
          where organisation_id = $1 and status = 'dead'
          order by created_at desc
          limit 20`,
        [organisationId],
      );

      const byStatus: Record<string, number> = {
        pending: 0,
        processing: 0,
        processed: 0,
        dead: 0,
      };
      for (const row of counts.rows) byStatus[row.status] = Number(row.count);

      const oldest = due.rows[0]?.oldest ?? null;
      return {
        counts: byStatus,
        oldestDueAt: oldest ? new Date(oldest).toISOString() : null,
        dead: dead.rows.map((row) => ({
          ...row,
          createdAt: new Date(row.createdAt).toISOString(),
        })),
      };
    } finally {
      await db.close();
    }
  }

  // -------------------------------------------------------------------------
  // helpers
  // -------------------------------------------------------------------------

  private serializeEntry(entry: Awaited<ReturnType<typeof getEntry>>) {
    if (!entry) throw new NotFoundException('Journal entry not found.');
    return {
      ...entry,
      debitMinor: entry.debitMinor.toString(),
      creditMinor: entry.creditMinor.toString(),
      lines: entry.lines.map((line) => ({
        ...line,
        debitMinor: line.debitMinor.toString(),
        creditMinor: line.creditMinor.toString(),
      })),
    };
  }

  private async latestPolicies(
    db: Awaited<ReturnType<AccountingDbService['getDb']>>,
    organisationId: string,
  ) {
    return db.query<{
      id: string;
      eventCode: string;
      version: number;
      lines: PolicyLineInput[];
      note: string;
      isAssumption: boolean;
    }>(
      `select p.id, p.event_code as "eventCode", p.version, p.lines, p.note,
              p.is_assumption as "isAssumption"
         from posting_policy p
         join (
           select event_code, max(version) as version
             from posting_policy where organisation_id = $1 group by event_code
         ) latest on latest.event_code = p.event_code and latest.version = p.version
        where p.organisation_id = $1
        order by p.event_code`,
      [organisationId],
    );
  }

  private parsePolicyLines(value: unknown): PolicyLineInput[] {
    if (!Array.isArray(value) || value.length < 2) {
      throw new BadRequestException('A posting policy needs at least two lines.');
    }

    return value.map((raw, index) => {
      if (!raw || typeof raw !== 'object') {
        throw new BadRequestException(`Policy line ${index + 1} is invalid.`);
      }
      const line = raw as Record<string, unknown>;
      const account = text(line.account, `Policy line ${index + 1} account`);
      const side = line.side;
      const amount = line.amount;

      if (side !== 'debit' && side !== 'credit') {
        throw new BadRequestException(`Policy line ${index + 1} must be debit or credit.`);
      }
      if (!AMOUNT_KEYS.includes(amount as PolicyLineInput['amount'])) {
        throw new BadRequestException(`Policy line ${index + 1} has an unknown amount key.`);
      }

      return { account, side, amount: amount as PolicyLineInput['amount'] };
    });
  }

  private parseEntryLines(value: unknown) {
    if (!Array.isArray(value)) {
      throw new BadRequestException('An entry needs at least two lines.');
    }

    const lines = value.map((raw, index) => {
      if (!raw || typeof raw !== 'object') {
        throw new BadRequestException(`Line ${index + 1} is invalid.`);
      }
      const line = raw as Record<string, unknown>;
      const account = text(line.account, `Line ${index + 1} account`);
      const debitMinor = money(line.debit, `Line ${index + 1} debit`);
      const creditMinor = money(line.credit, `Line ${index + 1} credit`);

      if (debitMinor < 0n || creditMinor < 0n) {
        throw new BadRequestException(`Line ${index + 1} cannot be negative.`);
      }
      if ((debitMinor === 0n) === (creditMinor === 0n)) {
        throw new BadRequestException(
          `Line ${index + 1} must carry exactly one of debit or credit.`,
        );
      }

      return {
        account,
        debitMinor,
        creditMinor,
        memo: typeof line.memo === 'string' ? line.memo.trim() : '',
      };
    });

    const debits = lines.reduce((total, line) => total + line.debitMinor, 0n);
    const credits = lines.reduce((total, line) => total + line.creditMinor, 0n);

    if (debits !== credits) {
      throw new BadRequestException('The entry is unbalanced: total debits must equal total credits.');
    }

    return lines;
  }
}
