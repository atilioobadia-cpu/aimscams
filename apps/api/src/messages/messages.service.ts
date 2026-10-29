import { Inject, Injectable } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@aimscams/db';

import { PRISMA } from '../prisma/prisma.module.js';
import type { AuthContext } from '../auth/auth.types.js';

@Injectable()
export class MessagesService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async listLogs(auth: AuthContext) {
    const organisationId = auth.user.organisation.id;
    const items = await this.prisma.messageLog.findMany({
      where: { organisationId },
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    });
    return {
      items: items.map((log) => ({
        id: log.id,
        channel: log.channel,
        recipient: log.recipient,
        body: log.body,
        status: log.status,
        provider: log.provider ?? 'N/A',
        externalRef: log.externalRef ?? 'N/A',
        credits: log.credits,
        failureReason: log.failureReason ?? 'N/A',
        sentAt: log.sentAt?.toISOString() ?? null,
        createdAt: log.createdAt.toISOString(),
      })),
      canView: auth.user.permissions.includes('Message : View') || auth.user.permissions.includes('Transaction : View'),
    };
  }

  async listTemplates(auth: AuthContext) {
    const organisationId = auth.user.organisation.id;
    const items = await this.prisma.messageTemplate.findMany({
      where: { organisationId },
      orderBy: [{ channel: 'asc' }, { name: 'asc' }],
    });
    return {
      items: items.map((t) => ({
        id: t.id,
        key: t.key,
        name: t.name,
        channel: t.channel,
        language: t.language,
        subject: t.subject ?? 'N/A',
        body: t.body,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      canView: auth.user.permissions.includes('Message : View') || auth.user.permissions.includes('Transaction : View'),
    };
  }

  async createTemplate(auth: AuthContext, body: Record<string, unknown>) {
    const organisationId = auth.user.organisation.id;
    const key = String(body.key ?? '').trim();
    const name = String(body.name ?? '').trim();
    const bodyText = String(body.body ?? '').trim();
    if (!key || !name || !bodyText) throw new Error('Key, name and body are required.');
    const template = await this.prisma.messageTemplate.create({
      data: {
        organisationId,
        key,
        name,
        channel: String(body.channel ?? 'SMS').trim().toUpperCase(),
        language: String(body.language ?? 'en').trim(),
        subject: body.subject ? String(body.subject).trim() : null,
        body: bodyText,
        status: 'ACTIVE',
      },
    });
    return { id: template.id, key: template.key, status: template.status };
  }

  async sendMessage(auth: AuthContext, body: Record<string, unknown>) {
    const organisationId = auth.user.organisation.id;
    const channel = String(body.channel ?? 'SMS').trim().toUpperCase();
    const recipient = String(body.recipient ?? '').trim();
    const text = String(body.body ?? '').trim();
    if (!recipient || !text) throw new Error('Recipient and body are required.');
    const log = await this.prisma.messageLog.create({
      data: {
        organisationId,
        branchId: auth.user.branch?.id ?? null,
        channel,
        recipient,
        body: text,
        status: 'QUEUED',
        provider: 'LOCAL_STUB',
      },
    });
    // Simulate delivery
    await this.prisma.messageLog.update({
      where: { id: log.id },
      data: { status: 'SENT', sentAt: new Date(), credits: 1 },
    });
    return { id: log.id, status: 'SENT' };
  }
}
