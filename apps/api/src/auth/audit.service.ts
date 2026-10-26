import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@aimscams/db';
import { PRISMA } from '../prisma/prisma.module.js';

export interface AuditInput {
  organisationId?: string | null;
  branchId?: string | null;
  actorUserId?: string | null;
  actorLabel?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async record(input: AuditInput): Promise<void> {
    if (!input.organisationId) {
      return;
    }

    const data: Prisma.AuditEventUncheckedCreateInput = {
      organisationId: input.organisationId,
      branchId: input.branchId ?? null,
      actorUserId: input.actorUserId ?? null,
      actorLabel: input.actorLabel ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      correlationId: input.correlationId ?? null,
    };

    if (input.before !== undefined) {
      data.before = input.before;
    }
    if (input.after !== undefined) {
      data.after = input.after;
    }

    try {
      await this.prisma.auditEvent.create({ data });
    } catch (error) {
      this.logger.error(`Could not write audit event ${input.action}`, error);
    }
  }
}
