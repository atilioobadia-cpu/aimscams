import { Inject, Injectable } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@aimscams/db';

import { PRISMA } from '../prisma/prisma.module.js';
import type { AuthContext } from '../auth/auth.types.js';
import {
  organisationBranchScope,
  parseRequestFilters,
  parseTransactionFilters,
  type TransactionFilters,
} from './transactions.logic.js';

@Injectable()
export class TransactionsService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

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
