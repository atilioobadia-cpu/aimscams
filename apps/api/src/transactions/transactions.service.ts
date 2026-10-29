import { Inject, Injectable } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@aimscams/db';
import { LedgerError, postEntry } from '@aimscams/ledger';

import { PRISMA } from '../prisma/prisma.module.js';
import type { AuthContext } from '../auth/auth.types.js';
import { AccountingDbService } from '../accounting/accounting-db.service.js';
import { AuditService } from '../auth/audit.service.js';
import { tellerType } from './transactions.catalog.js';
import {
  organisationBranchScope,
  parseRequestFilters,
  parseTransactionFilters,
  type TransactionFilters,
} from './transactions.logic.js';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly accountingDb: AccountingDbService,
    private readonly audit: AuditService,
  ) {}

  async listTransactions(
    auth: AuthContext,
    query: Readonly<Record<string, unknown>>,
  ) {
    const filters = parseTransactionFilters(query);
    const scope = organisationBranchScope(
      auth.user.organisation.id,
      auth.user.branch?.id ?? null,
    );
    const where = this.transactionWhere(auth, filters);
    const [items, total, accountingCounts] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        select: {
          id: true,
          transactionNo: true,
          type: true,
          category: true,
          amountMinor: true,
          drCr: true,
          paymentMethod: true,
          valueDate: true,
          receiptNo: true,
          status: true,
          accountingStatus: true,
          narration: true,
          createdAt: true,
          client: { select: { fullName: true, referenceNo: true } },
          loan: { select: { loanNumber: true } },
          savingsAccount: { select: { accountNumber: true } },
          branch: { select: { name: true } },
          tillSession: { select: { teller: { select: { fullName: true } } } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.groupBy({
        by: ['accountingStatus'],
        where: scope,
        _count: { _all: true },
      }),
    ]);
    const accountingCountByStatus = new Map(
      accountingCounts.map((status) => [
        status.accountingStatus,
        status._count._all,
      ]),
    );
    const pendingCount = accountingCountByStatus.get('PENDING') ?? 0;
    const failedCount = accountingCountByStatus.get('FAILED') ?? 0;

    return {
      items: items.map((item) => ({
        id: item.id,
        transactionNo: item.transactionNo,
        type: item.type,
        category: item.category,
        amountMinor: item.amountMinor.toString(),
        drCr: item.drCr,
        paymentMethod: item.paymentMethod ?? 'N/A',
        valueDate: item.valueDate?.toISOString().slice(0, 10) ?? 'N/A',
        receiptNo: item.receiptNo ?? 'N/A',
        status: item.status,
        accountingStatus: item.accountingStatus,
        narration: item.narration ?? 'N/A',
        createdAt: item.createdAt.toISOString(),
        clientName: item.client?.fullName ?? 'N/A',
        clientReference: item.client?.referenceNo ?? 'N/A',
        loanNumber: item.loan?.loanNumber ?? 'N/A',
        accountNumber: item.savingsAccount?.accountNumber ?? 'N/A',
        branchName: item.branch?.name ?? 'N/A',
        tellerName: item.tillSession?.teller.fullName ?? 'N/A',
      })),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      summary: {
        pending: pendingCount,
        failed: failedCount,
        unposted: pendingCount + failedCount,
      },
      canView: auth.user.permissions.includes('Transaction : View'),
    };
  }

  async listRequests(
    auth: AuthContext,
    query: Readonly<Record<string, unknown>>,
  ) {
    const filters = parseRequestFilters(query);
    const organisationId = auth.user.organisation.id;
    const scope = organisationBranchScope(
      organisationId,
      auth.user.branch?.id ?? null,
    );
    const where: Prisma.RequestWhereInput = { ...scope };
    if (filters.status) where.status = filters.status;
    if (filters.requestType) where.requestType = filters.requestType;
    if (filters.assignedToMe) where.currentAssigneeId = auth.user.id;
    if (filters.q) {
      where.OR = [
        { requestNo: { contains: filters.q, mode: 'insensitive' } },
        { requestType: { contains: filters.q, mode: 'insensitive' } },
        { reason: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    const [requests, total, statusCounts, assignedCount] = await Promise.all([
      this.prisma.request.findMany({
        where,
        select: {
          id: true,
          requestNo: true,
          requestType: true,
          amountMinor: true,
          status: true,
          currentAssigneeId: true,
          requestedByUserId: true,
          approvedByUserId: true,
          approvedAt: true,
          reason: true,
          createdAt: true,
          branch: { select: { name: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.request.count({ where }),
      this.prisma.request.groupBy({
        by: ['status'],
        where: scope,
        _count: { _all: true },
      }),
      this.prisma.request.count({
        where: { ...scope, currentAssigneeId: auth.user.id },
      }),
    ]);

    const userIds = [
      ...new Set(
        requests.flatMap((request) =>
          [
            request.currentAssigneeId,
            request.requestedByUserId,
            request.approvedByUserId,
          ].filter((userId): userId is string => userId !== null),
        ),
      ),
    ];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { organisationId, id: { in: userIds } },
          select: { id: true, fullName: true },
        })
      : [];
    const userNames = new Map(users.map((user) => [user.id, user.fullName]));
    const counts = new Map(
      statusCounts.map((status) => [status.status, status._count._all]),
    );
    const pendingCount = counts.get('PENDING') ?? 0;

    return {
      items: requests.map((request) => ({
        id: request.id,
        requestNo: request.requestNo,
        requestType: request.requestType,
        amountMinor: request.amountMinor?.toString() ?? null,
        status: request.status,
        currentAssignee:
          userNames.get(request.currentAssigneeId ?? '') ?? 'N/A',
        requestedBy: userNames.get(request.requestedByUserId ?? '') ?? 'N/A',
        approvedBy: userNames.get(request.approvedByUserId ?? '') ?? 'N/A',
        approvedAt: request.approvedAt?.toISOString() ?? 'N/A',
        reason: request.reason ?? 'N/A',
        branchName: request.branch?.name ?? 'N/A',
        createdAt: request.createdAt.toISOString(),
      })),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      counts: {
        total: [...counts.values()].reduce((sum, count) => sum + count, 0),
        active: pendingCount,
        pending: pendingCount,
        approved: counts.get('APPROVED') ?? 0,
        rejected: counts.get('REJECTED') ?? 0,
        cancelled: counts.get('CANCELLED') ?? 0,
        assigned: assignedCount,
      },
      canView: auth.user.permissions.includes('Transaction : View'),
    };
  }

  async getTill(auth: AuthContext) {
    const businessDate = todayInDarEsSalaam();
    const date = dateOnly(businessDate);
    const session = await this.prisma.tillSession.findUnique({
      where: { tellerId_businessDate: { tellerId: auth.user.id, businessDate: date } },
      select: {
        id: true,
        businessDate: true,
        openingFloatMinor: true,
        closingCountedMinor: true,
        systemBalanceMinor: true,
        varianceMinor: true,
        status: true,
        openedAt: true,
        closedAt: true,
        branch: { select: { name: true } },
      },
    });
    const transactions = session
      ? await this.prisma.transaction.findMany({
          where: { tillSessionId: session.id },
          select: { amountMinor: true, drCr: true },
        })
      : [];
    const cashIn = transactions
      .filter((item) => item.drCr === "DR")
      .reduce((sum, item) => sum + item.amountMinor, 0n);
    const cashOut = transactions
      .filter((item) => item.drCr === "CR")
      .reduce((sum, item) => sum + item.amountMinor, 0n);
    const systemBalance = (session?.openingFloatMinor ?? 0n) + cashIn - cashOut;
    return {
      businessDate,
      session: session
        ? {
            id: session.id,
            businessDate: session.businessDate.toISOString().slice(0, 10),
            openingFloatMinor: session.openingFloatMinor.toString(),
            closingCountedMinor: session.closingCountedMinor?.toString() ?? null,
            systemBalanceMinor: systemBalance.toString(),
            varianceMinor: session.varianceMinor?.toString() ?? null,
            status: session.status,
            openedAt: session.openedAt.toISOString(),
            closedAt: session.closedAt?.toISOString() ?? null,
            branchName: session.branch?.name ?? "N/A",
          }
        : null,
      cashInMinor: cashIn.toString(),
      cashOutMinor: cashOut.toString(),
      canOpen: auth.user.permissions.includes("Transaction : Create"),
      canClose: auth.user.permissions.includes("Transaction : Create"),
    };
  }

  async openTill(auth: AuthContext, body: Record<string, unknown>) {
    if (!auth.user.permissions.includes("Transaction : Create")) {
      throw new Error("forbidden");
    }
    const businessDate = todayInDarEsSalaam();
    const date = dateOnly(businessDate);
    const existing = await this.prisma.tillSession.findUnique({
      where: { tellerId_businessDate: { tellerId: auth.user.id, businessDate: date } },
    });
    if (existing) throw new Error("A till session is already open for today.");
    if (!body || typeof body.openingFloatMinor === "undefined") {
      throw new Error(`Missing openingFloatMinor (body=${JSON.stringify(body)})`);
    }
    const openingFloatMinor = parseMinor(body.openingFloatMinor);
    const session = await this.prisma.tillSession.create({
      data: {
        organisationId: auth.user.organisation.id,
        branchId: auth.user.branch?.id ?? null,
        tellerId: auth.user.id,
        businessDate: date,
        openingFloatMinor,
        status: "OPEN",
      },
    });
    if (openingFloatMinor > 0n) {
      await this.postLedgerEntry(auth, {
        entryDate: businessDate,
        eventCode: "TILL_OPENING",
        sourceType: "till_session",
        sourceId: session.id,
        idempotencyKey: `till-open:${session.id}`,
        description: "Till opening float",
        lines: [
          { account: "1010", debitMinor: openingFloatMinor },
          { account: "1002", creditMinor: openingFloatMinor },
        ],
      });
    }
    return { id: session.id, status: session.status };
  }

  async closeTill(auth: AuthContext, body: Record<string, unknown>) {
    if (!auth.user.permissions.includes("Transaction : Create")) {
      throw new Error("forbidden");
    }
    const businessDate = todayInDarEsSalaam();
    const date = dateOnly(businessDate);
    const session = await this.prisma.tillSession.findUnique({
      where: { tellerId_businessDate: { tellerId: auth.user.id, businessDate: date } },
    });
    if (!session || session.status !== "OPEN") throw new Error("No open till session for today.");
    const countedMinor = parseMinor(body.countedMinor);
    const transactions = await this.prisma.transaction.findMany({
      where: { tillSessionId: session.id },
      select: { amountMinor: true, drCr: true },
    });
    const cashIn = transactions.filter((t) => t.drCr === "DR").reduce((s, t) => s + t.amountMinor, 0n);
    const cashOut = transactions.filter((t) => t.drCr === "CR").reduce((s, t) => s + t.amountMinor, 0n);
    const systemBalance = session.openingFloatMinor + cashIn - cashOut;
    const variance = countedMinor - systemBalance;
    await this.prisma.tillSession.update({
      where: { id: session.id },
      data: {
        closingCountedMinor: countedMinor,
        systemBalanceMinor: systemBalance,
        varianceMinor: variance,
        status: "CLOSED",
        closedAt: new Date(),
      },
    });
    if (variance !== 0n) {
      const requestNo = await this.nextRequestNo(auth.user.organisation.id);
      await this.prisma.request.create({
        data: {
          organisationId: auth.user.organisation.id,
          branchId: auth.user.branch?.id ?? null,
          requestNo,
          requestType: "TILL_VARIANCE",
          payload: {
            sessionId: session.id,
            countedMinor: countedMinor.toString(),
            systemBalanceMinor: systemBalance.toString(),
          },
          amountMinor: variance < 0n ? -variance : variance,
          status: "PENDING",
          currentAssigneeId: auth.user.id,
          requestedByUserId: auth.user.id,
        },
      });
    }
    return { status: "CLOSED", varianceMinor: variance.toString() };
  }

  async listTillSessions(auth: AuthContext, query: Readonly<Record<string, unknown>>) {
    const organisationId = auth.user.organisation.id;
    const branchId = auth.user.branch?.id ?? null;
    const where: Prisma.TillSessionWhereInput = { organisationId };
    if (branchId) where.branchId = branchId;
    const tellerId = typeof query.tellerId === "string" ? query.tellerId.trim() : undefined;
    if (tellerId) where.tellerId = tellerId;
    const from = typeof query.from === "string" ? query.from.trim() : undefined;
    const to = typeof query.to === "string" ? query.to.trim() : undefined;
    if (from || to) {
      where.businessDate = {
        ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
        ...(to ? { lte: new Date(`${to}T00:00:00.000Z`) } : {}),
      };
    }
    const sessions = await this.prisma.tillSession.findMany({
      where,
      select: {
        id: true,
        businessDate: true,
        openingFloatMinor: true,
        closingCountedMinor: true,
        systemBalanceMinor: true,
        varianceMinor: true,
        status: true,
        openedAt: true,
        closedAt: true,
        teller: { select: { fullName: true, email: true } },
        branch: { select: { name: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: [{ businessDate: "desc" }, { openedAt: "desc" }],
    });
    return {
      items: sessions.map((session) => ({
        id: session.id,
        businessDate: session.businessDate.toISOString().slice(0, 10),
        openingFloatMinor: session.openingFloatMinor.toString(),
        closingCountedMinor: session.closingCountedMinor?.toString() ?? null,
        systemBalanceMinor: session.systemBalanceMinor?.toString() ?? null,
        varianceMinor: session.varianceMinor?.toString() ?? null,
        status: session.status,
        openedAt: session.openedAt.toISOString(),
        closedAt: session.closedAt?.toISOString() ?? null,
        tellerName: session.teller.fullName,
        tellerEmail: session.teller.email,
        branchName: session.branch?.name ?? "N/A",
        transactionCount: session._count.transactions,
      })),
      canView: auth.user.permissions.includes("Transaction : View"),
    };
  }

  async createTransaction(auth: AuthContext, body: Record<string, unknown>) {
    if (!auth.user.permissions.includes("Transaction : Create")) {
      throw new Error("forbidden");
    }
    const typeCode = String(body.type ?? "").trim().toUpperCase();
    const type = tellerType(typeCode);
    if (!type) throw new Error("Unknown transaction type.");
    const amountMinor = parseMinor(body.amountMinor);
    const organisationId = auth.user.organisation.id;
    const branchId = auth.user.branch?.id ?? null;
    const till = await this.getTill(auth);
    const tillSessionId = till.session?.id ?? null;
    const cashAccount = tillSessionId ? "1010" : "1002";
    const clientId = body.clientId ? String(body.clientId) : null;
    const savingsAccountId = body.savingsAccountId ? String(body.savingsAccountId) : null;
    const loanId = body.loanId ? String(body.loanId) : null;
    const counterAccountCode = body.counterAccountCode ? String(body.counterAccountCode) : null;
    const narration = body.narration ? String(body.narration).trim() : null;
    const paymentMethod = body.paymentMethod ? String(body.paymentMethod).trim().toUpperCase() : "CASH";
    const valueDate = body.valueDate ? String(body.valueDate) : todayInDarEsSalaam();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valueDate)) throw new Error("Invalid value date.");

    const lines = buildLedgerLines(type, amountMinor, cashAccount, counterAccountCode, "1201");

    const transactionNo = await this.nextTransactionNo(organisationId);
    const idempotencyKey = body.idempotencyKey ? String(body.idempotencyKey) : `txn:${transactionNo}`;
    const row = await this.prisma.transaction.create({
      data: {
        organisationId,
        branchId,
        tillSessionId,
        transactionNo,
        type: type.code,
        category: type.category,
        clientId,
        savingsAccountId,
        loanId,
        amountMinor,
        drCr: type.cashSide,
        paymentMethod,
        valueDate: dateOnly(valueDate),
        chequeNo: body.chequeNo ? String(body.chequeNo).trim() : null,
        receiptNo: body.receiptNo ? String(body.receiptNo).trim() : null,
        externalRef: body.externalRef ? String(body.externalRef).trim() : null,
        provider: body.provider ? String(body.provider).trim() : null,
        narration,
        status: "SUBMITTED",
        accountingStatus: "PENDING",
        idempotencyKey,
        createdByUserId: auth.user.id,
      },
    });

    await this.applyBalanceEffects(type.code, amountMinor, { clientId, savingsAccountId, loanId, organisationId });

    let accountingStatus = "PENDING";
    try {
      await this.postLedgerEntry(auth, {
        entryDate: valueDate,
        eventCode: type.code,
        sourceType: "transaction",
        sourceId: row.id,
        idempotencyKey,
        description: narration || `${type.label} ${transactionNo}`,
        lines,
      });
      accountingStatus = "POSTED";
    } catch (error) {
      accountingStatus = "FAILED";
      console.error("ledger posting failed", error);
    }
    await this.prisma.transaction.update({
      where: { id: row.id },
      data: { accountingStatus, status: accountingStatus === "POSTED" ? "APPROVED" : "SUBMITTED" },
    });

    await this.audit.record({
      organisationId,
      branchId,
      actorUserId: auth.user.id,
      actorLabel: auth.user.fullName,
      action: "Transaction : Create",
      entityType: "Transaction",
      entityId: row.id,
      after: { transactionNo, type: type.code, amountMinor: amountMinor.toString(), accountingStatus },
      ipAddress: null,
      userAgent: null,
    });

    return {
      id: row.id,
      transactionNo,
      type: type.code,
      category: type.category,
      amountMinor: amountMinor.toString(),
      drCr: type.cashSide,
      accountingStatus,
      status: accountingStatus === "POSTED" ? "APPROVED" : "SUBMITTED",
    };
  }

  async getRequest(auth: AuthContext, id: string) {
    const request = await this.prisma.request.findFirst({
      where: { id, organisationId: auth.user.organisation.id },
      select: {
        id: true,
        requestNo: true,
        requestType: true,
        payload: true,
        amountMinor: true,
        status: true,
        currentAssigneeId: true,
        requestedByUserId: true,
        approvedByUserId: true,
        approvedAt: true,
        reason: true,
        createdAt: true,
        branch: { select: { name: true } },
      },
    });
    if (!request) throw new Error("Request not found.");
    const userIds = [request.currentAssigneeId, request.requestedByUserId, request.approvedByUserId].filter(
      (value): value is string => value !== null,
    );
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { organisationId: auth.user.organisation.id, id: { in: userIds } },
          select: { id: true, fullName: true },
        })
      : [];
    const names = new Map(users.map((user) => [user.id, user.fullName]));
    return {
      id: request.id,
      requestNo: request.requestNo,
      requestType: request.requestType,
      payload: request.payload,
      amountMinor: request.amountMinor?.toString() ?? null,
      status: request.status,
      currentAssignee: names.get(request.currentAssigneeId ?? "") ?? "N/A",
      requestedBy: names.get(request.requestedByUserId ?? "") ?? "N/A",
      approvedBy: names.get(request.approvedByUserId ?? "") ?? "N/A",
      approvedAt: request.approvedAt?.toISOString() ?? null,
      reason: request.reason ?? null,
      branchName: request.branch?.name ?? "N/A",
      createdAt: request.createdAt.toISOString(),
      canApprove: auth.user.permissions.includes("Transaction : Approve"),
      canReject: auth.user.permissions.includes("Transaction : Reject"),
    };
  }

  async approveRequest(auth: AuthContext, id: string) {
    if (!auth.user.permissions.includes("Transaction : Approve")) {
      throw new Error("forbidden");
    }
    const request = await this.prisma.request.findFirst({
      where: { id, organisationId: auth.user.organisation.id },
    });
    if (!request) throw new Error("Request not found.");
    if (request.status !== "PENDING") throw new Error("Request is not pending.");

    if (request.requestType === "TRANSACTION_REVERSAL") {
      const payload = request.payload as { transactionId?: string };
      const transactionId = payload?.transactionId;
      if (transactionId) {
        const transaction = await this.prisma.transaction.findFirst({
          where: { id: transactionId, organisationId: auth.user.organisation.id },
        });
        if (transaction && transaction.accountingStatus === "POSTED") {
          const entry = await this.findPostedEntry(auth.user.organisation.id, transaction.id);
          if (entry) {
            const db = await this.accountingDb.getDb(auth.user.organisation.id);
            try {
              const { reverseEntry } = await import("@aimscams/ledger");
              await reverseEntry(db, entry, {
                tenantId: auth.user.organisation.id,
                entryDate: todayInDarEsSalaam(),
                description: `Reversal of transaction ${transaction.transactionNo}`,
              });
            } finally {
              await db.close();
            }
          }
          await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: "REVERSED", reversedByUserId: auth.user.id },
          });
        }
      }
    }

    await this.prisma.request.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        approvedByUserId: auth.user.id,
        approvedAt: new Date(),
      },
    });
    return { status: "APPROVED" };
  }

  async rejectRequest(auth: AuthContext, id: string, reason: string) {
    if (!auth.user.permissions.includes("Transaction : Reject")) {
      throw new Error("forbidden");
    }
    const request = await this.prisma.request.findFirst({
      where: { id, organisationId: auth.user.organisation.id },
    });
    if (!request) throw new Error("Request not found.");
    if (request.status !== "PENDING") throw new Error("Request is not pending.");
    await this.prisma.request.update({
      where: { id: request.id },
      data: {
        status: "REJECTED",
        reason: reason.trim() || request.reason,
        approvedByUserId: auth.user.id,
        approvedAt: new Date(),
      },
    });
    return { status: "REJECTED" };
  }

  private async findPostedEntry(organisationId: string, transactionId: string): Promise<string | null> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      select id from journal_entry
      where organisation_id = ${organisationId}::uuid
        and source_type = 'transaction'
        and source_id = ${transactionId}::uuid
        and status = 'posted'
        and reversal_of is null
      order by posted_at desc
      limit 1
    `;
    return rows[0]?.id ?? null;
  }

  async resubmitTransaction(auth: AuthContext, id: string) {
    const row = await this.prisma.transaction.findFirst({
      where: { id, organisationId: auth.user.organisation.id },
    });
    if (!row) throw new Error("Transaction not found.");
    if (row.accountingStatus === "POSTED") return { accountingStatus: "POSTED" };
    const type = tellerType(row.type);
    if (!type) throw new Error("Unknown transaction type.");
    const till = await this.getTill(auth);
    const cashAccount = till.session?.id === row.tillSessionId ? "1010" : "1002";
    const lines = buildLedgerLines(type, row.amountMinor, cashAccount, null, "1201");
    const valueDate = row.valueDate?.toISOString().slice(0, 10) ?? todayInDarEsSalaam();
    try {
      await this.postLedgerEntry(auth, {
        entryDate: valueDate,
        eventCode: type.code,
        sourceType: "transaction",
        sourceId: row.id,
        idempotencyKey: row.idempotencyKey ?? `txn:${row.id}`,
        description: row.narration || `${type.label} ${row.transactionNo}`,
        lines,
      });
      await this.prisma.transaction.update({
        where: { id: row.id },
        data: { accountingStatus: "POSTED", status: "APPROVED" },
      });
      return { accountingStatus: "POSTED" };
    } catch (error) {
      console.error("resubmit failed", error);
      await this.prisma.transaction.update({
        where: { id: row.id },
        data: { accountingStatus: "FAILED" },
      });
      return { accountingStatus: "FAILED" };
    }
  }

  private async applyBalanceEffects(
    type: string,
    amountMinor: bigint,
    context: { clientId: string | null; savingsAccountId: string | null; loanId: string | null; organisationId: string },
  ) {
    if (type === "SAVINGS_DEPOSIT" || type === "BULK_DEPOSIT") {
      if (context.savingsAccountId) {
        await this.prisma.savingsAccount.update({
          where: { id: context.savingsAccountId },
          data: { balanceMinor: { increment: amountMinor } },
        });
      }
    } else if (type === "SAVINGS_WITHDRAWAL") {
      if (context.savingsAccountId) {
        await this.prisma.savingsAccount.update({
          where: { id: context.savingsAccountId },
          data: { balanceMinor: { decrement: amountMinor } },
        });
      }
    } else if (type === "LOAN_DISBURSEMENT" || type === "BULK_LOAN_DISBURSEMENT") {
      if (context.loanId) {
        await this.prisma.loan.update({
          where: { id: context.loanId },
          data: { status: "DISBURSED", disbursedAt: new Date() },
        });
      }
    }
  }

  private async postLedgerEntry(
    auth: AuthContext,
    input: {
      entryDate: string;
      eventCode: string;
      sourceType: string;
      sourceId: string;
      idempotencyKey: string;
      description: string;
      lines: { account: string; debitMinor?: bigint; creditMinor?: bigint; memo?: string }[];
    },
  ) {
    const db = await this.accountingDb.getDb(auth.user.organisation.id);
    try {
      await postEntry(db, {
        tenantId: auth.user.organisation.id,
        entryDate: input.entryDate,
        eventCode: input.eventCode,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        idempotencyKey: input.idempotencyKey,
        description: input.description,
        lines: input.lines,
      });
    } catch (error) {
      if (error instanceof LedgerError) {
        if (error.code === 'not_found') throw new Error(error.message);
        if (error.code === 'conflict') throw new Error(error.message);
      }
      if (error instanceof Error && /no fiscal period covers|unbalanced|not in the chart|is closed/.test(error.message)) {
        throw new Error(error.message);
      }
      throw error;
    } finally {
      await db.close();
    }
  }

  private async nextTransactionNo(organisationId: string): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const last = await this.prisma.transaction.findFirst({
        where: { organisationId },
        orderBy: { transactionNo: "desc" },
        select: { transactionNo: true },
      });
      const next = String((Number(last?.transactionNo ?? "0") || 0) + 1).padStart(6, "0");
      const exists = await this.prisma.transaction.findUnique({
        where: { organisationId_transactionNo: { organisationId, transactionNo: next } },
      });
      if (!exists) return next;
    }
    throw new Error("Could not allocate a transaction number.");
  }

  private async nextRequestNo(organisationId: string): Promise<string> {
    const last = await this.prisma.request.findFirst({
      where: { organisationId },
      orderBy: { requestNo: "desc" },
      select: { requestNo: true },
    });
    return String((Number(last?.requestNo ?? "0") || 0) + 1).padStart(6, "0");
  }

  async getTransaction(auth: AuthContext, id: string) {
    const item = await this.prisma.transaction.findFirst({
      where: { id, organisationId: auth.user.organisation.id },
      select: {
        id: true,
        transactionNo: true,
        type: true,
        category: true,
        amountMinor: true,
        drCr: true,
        paymentMethod: true,
        valueDate: true,
        receiptNo: true,
        status: true,
        accountingStatus: true,
        narration: true,
        createdAt: true,
        client: { select: { fullName: true, referenceNo: true } },
        loan: { select: { loanNumber: true } },
        savingsAccount: { select: { accountNumber: true } },
        branch: { select: { name: true } },
        tillSession: { select: { teller: { select: { fullName: true } } } },
      },
    });
    if (!item) throw new Error("Transaction not found.");
    return {
      id: item.id,
      transactionNo: item.transactionNo,
      type: item.type,
      category: item.category,
      amountMinor: item.amountMinor.toString(),
      drCr: item.drCr,
      paymentMethod: item.paymentMethod ?? "N/A",
      valueDate: item.valueDate?.toISOString().slice(0, 10) ?? "N/A",
      receiptNo: item.receiptNo ?? "N/A",
      status: item.status,
      accountingStatus: item.accountingStatus,
      narration: item.narration ?? "N/A",
      createdAt: item.createdAt.toISOString(),
      clientName: item.client?.fullName ?? "N/A",
      clientReference: item.client?.referenceNo ?? "N/A",
      loanNumber: item.loan?.loanNumber ?? "N/A",
      accountNumber: item.savingsAccount?.accountNumber ?? "N/A",
      branchName: item.branch?.name ?? "N/A",
      tellerName: item.tillSession?.teller.fullName ?? "N/A",
      canView: auth.user.permissions.includes("Transaction : View"),
    };
  }

  private transactionWhere(
    auth: AuthContext,
    filters: TransactionFilters,
  ): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {
      ...organisationBranchScope(
        auth.user.organisation.id,
        auth.user.branch?.id ?? null,
      ),
    };
    if (filters.status) where.status = filters.status;
    if (filters.accountingStatus)
      where.accountingStatus = filters.accountingStatus;
    if (filters.category) where.category = filters.category;
    if (filters.tellerId)
      where.tillSession = { is: { tellerId: filters.tellerId } };
    if (filters.from || filters.to) {
      where.valueDate = {
        ...(filters.from
          ? { gte: new Date(`${filters.from}T00:00:00.000Z`) }
          : {}),
        ...(filters.to ? { lte: new Date(`${filters.to}T00:00:00.000Z`) } : {}),
      };
    }
    if (filters.q) {
      where.OR = [
        { transactionNo: { contains: filters.q, mode: 'insensitive' } },
        { type: { contains: filters.q, mode: 'insensitive' } },
        {
          client: {
            is: { fullName: { contains: filters.q, mode: 'insensitive' } },
          },
        },
        {
          client: {
            is: { referenceNo: { contains: filters.q, mode: 'insensitive' } },
          },
        },
      ];
    }
    return where;
  }
}

function todayInDarEsSalaam(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function dateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function parseMinor(value: unknown): bigint {
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text)) throw new Error("Amount must be a whole number of minor units.");
  const parsed = BigInt(text);
  if (parsed <= 0n) throw new Error("Amount must be greater than zero.");
  return parsed;
}

function buildLedgerLines(
  type: { code: string; cashSide: "DR" | "CR" },
  amountMinor: bigint,
  cashAccount: string,
  counterAccountCode: string | null,
  loanAccountCode: string,
): { account: string; debitMinor?: bigint; creditMinor?: bigint; memo?: string }[] {
  const lines: { account: string; debitMinor?: bigint; creditMinor?: bigint; memo?: string }[] = [];
  switch (type.code) {
    case "SAVINGS_DEPOSIT":
    case "BULK_DEPOSIT":
      lines.push({ account: cashAccount, debitMinor: amountMinor });
      lines.push({ account: "2101", creditMinor: amountMinor });
      break;
    case "SAVINGS_WITHDRAWAL":
      lines.push({ account: "2101", debitMinor: amountMinor });
      lines.push({ account: cashAccount, creditMinor: amountMinor });
      break;
    case "SHARES_DEPOSIT":
      lines.push({ account: cashAccount, debitMinor: amountMinor });
      lines.push({ account: "3404", creditMinor: amountMinor });
      break;
    case "SHARES_WITHDRAWAL":
      lines.push({ account: "3404", debitMinor: amountMinor });
      lines.push({ account: cashAccount, creditMinor: amountMinor });
      break;
    case "LOAN_REPAYMENT":
      lines.push({ account: cashAccount, debitMinor: amountMinor });
      lines.push({ account: loanAccountCode, creditMinor: amountMinor });
      break;
    case "LOAN_DISBURSEMENT":
    case "BULK_LOAN_DISBURSEMENT":
      lines.push({ account: loanAccountCode, debitMinor: amountMinor });
      lines.push({ account: cashAccount, creditMinor: amountMinor });
      break;
    case "LOAN_APPLICATION_FEE":
      lines.push({ account: cashAccount, debitMinor: amountMinor });
      lines.push({ account: "4101", creditMinor: amountMinor });
      break;
    case "FEE_PENALTY_APPLY":
      lines.push({ account: loanAccountCode, debitMinor: amountMinor });
      lines.push({ account: "4104", creditMinor: amountMinor });
      break;
    case "FEE_PENALTY_REVERSE":
      lines.push({ account: "4104", debitMinor: amountMinor });
      lines.push({ account: loanAccountCode, creditMinor: amountMinor });
      break;
    case "GL_RECEIPT":
    case "OTHER_INCOME":
      if (!counterAccountCode) throw new Error("A counter account is required.");
      lines.push({ account: cashAccount, debitMinor: amountMinor });
      lines.push({ account: counterAccountCode, creditMinor: amountMinor });
      break;
    case "GL_PAYMENT":
    case "RECORD_EXPENSE":
      if (!counterAccountCode) throw new Error("A counter account is required.");
      lines.push({ account: counterAccountCode, debitMinor: amountMinor });
      lines.push({ account: cashAccount, creditMinor: amountMinor });
      break;
    case "PAY_CORPORATE_TAX":
      lines.push({ account: "2001", debitMinor: amountMinor });
      lines.push({ account: cashAccount, creditMinor: amountMinor });
      break;
    case "CONTRA":
      if (!counterAccountCode) throw new Error("A counter account is required.");
      lines.push({ account: counterAccountCode, debitMinor: amountMinor });
      lines.push({ account: cashAccount, creditMinor: amountMinor });
      break;
    case "TILL_OPENING":
      lines.push({ account: "1010", debitMinor: amountMinor });
      lines.push({ account: "1002", creditMinor: amountMinor });
      break;
    case "TILL_TRANSFER":
      if (!counterAccountCode) throw new Error("A counter account is required.");
      lines.push({ account: counterAccountCode, debitMinor: amountMinor });
      lines.push({ account: cashAccount, creditMinor: amountMinor });
      break;
    case "TILL_BALANCE":
      return [];
    case "ERROR_CORRECTION":
      lines.push({ account: cashAccount, debitMinor: amountMinor });
      lines.push({ account: cashAccount, creditMinor: amountMinor });
      break;
    default:
      throw new Error("This transaction type is not supported yet.");
  }
  if (lines.length === 0) return lines;
  const debit = lines.reduce((sum, line) => sum + (line.debitMinor ?? 0n), 0n);
  const credit = lines.reduce((sum, line) => sum + (line.creditMinor ?? 0n), 0n);
  if (debit !== credit) throw new Error("The generated posting is not balanced.");
  return lines;
}
