import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { PrismaClient } from '@aimscams/db';
import { PRISMA } from '../prisma/prisma.module.js';
import {
  PASSWORD_RESET_MAX_PER_IP,
  PASSWORD_RESET_MAX_PER_USER,
  PASSWORD_RESET_TTL_MS,
  PASSWORD_RESET_WINDOW_MS,
} from './auth.constants.js';
import {
  generateToken,
  hashSessionToken,
  normalizeEmail,
} from './auth.crypto.js';
import type { LoginContext } from './auth.service.js';
import { AuditService } from './audit.service.js';
import { MailService } from './mail.service.js';
import { hashPassword, passwordPolicyError } from './password-policy.js';

export interface PasswordResetRequestResult {
  devResetUrl?: string;
}

function resetUrl(token: string): string {
  const origin = process.env.WEB_ORIGIN?.trim() || 'http://localhost:3000';
  const url = new URL('/forgot-password', origin);
  url.searchParams.set('token', token);
  return url.toString();
}

function devDeliveryEnabled(): boolean {
  return (
    process.env.APP_ENV === 'local' &&
    process.env.PASSWORD_RESET_DEV_DELIVERY === 'true'
  );
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {}

  async request(
    emailInput: string,
    context: LoginContext,
  ): Promise<PasswordResetRequestResult> {
    const email = normalizeEmail(emailInput);
    const now = new Date();
    const windowStart = new Date(now.getTime() - PASSWORD_RESET_WINDOW_MS);

    if (context.ipAddress) {
      const fromIp = await this.prisma.passwordResetToken.count({
        where: {
          requestedIp: context.ipAddress,
          createdAt: { gte: windowStart },
        },
      });
      if (fromIp >= PASSWORD_RESET_MAX_PER_IP) {
        return {};
      }
    }

    const user = await this.prisma.user.findFirst({
      where: { email, status: 'ACTIVE' },
    });
    if (!user) {
      return {};
    }

    const forUser = await this.prisma.passwordResetToken.count({
      where: {
        userId: user.id,
        createdAt: { gte: windowStart },
      },
    });
    if (forUser >= PASSWORD_RESET_MAX_PER_USER) {
      return {};
    }

    const token = generateToken();
    const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TTL_MS);
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: now },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashSessionToken(token),
          requestedIp: context.ipAddress ?? null,
          requestedUserAgent: context.userAgent ?? null,
          expiresAt,
        },
      }),
    ]);

    await this.audit.record({
      organisationId: user.organisationId,
      branchId: user.branchId,
      actorUserId: user.id,
      actorLabel: user.email,
      action: 'Password reset requested',
      entityType: 'User',
      entityId: user.id,
      after: { expiresAt: expiresAt.toISOString() },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    if (devDeliveryEnabled()) {
      return { devResetUrl: resetUrl(token) };
    }

    if (this.mail.configured) {
      try {
        await this.mail.sendPasswordReset({
          to: user.email,
          recipientName: user.fullName,
          resetUrl: resetUrl(token),
          expiresMinutes: PASSWORD_RESET_TTL_MS / 60_000,
        });
      } catch (error) {
        this.logger.error(
          `Could not deliver password reset mail for user ${user.id}`,
          error,
        );
        await this.audit.record({
          organisationId: user.organisationId,
          branchId: user.branchId,
          actorUserId: user.id,
          actorLabel: user.email,
          action: 'Password reset delivery failed',
          entityType: 'User',
          entityId: user.id,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
      }
    } else {
      this.logger.error(
        'Password reset requested but neither SMTP nor local dev delivery is configured.',
      );
    }

    return {};
  }

  async confirm(
    tokenInput: string,
    password: string,
    context: LoginContext,
  ): Promise<void> {
    const token = tokenInput.trim();
    if (!token) {
      throw this.invalidToken();
    }

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: { user: true },
    });
    const now = new Date();
    if (
      !record ||
      record.consumedAt ||
      record.expiresAt.getTime() <= now.getTime() ||
      record.user.status !== 'ACTIVE'
    ) {
      throw this.invalidToken();
    }

    const policyError = passwordPolicyError(password, record.user.email);
    if (policyError) {
      throw new BadRequestException(policyError);
    }

    const passwordHash = await hashPassword(password);
    const revokedSessions = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: record.id,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        throw this.invalidToken();
      }

      await tx.user.update({
        where: { id: record.userId },
        data: {
          passwordHash,
          failedLoginCount: 0,
          lockedUntil: null,
        },
      });

      const sessions = await tx.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      await tx.mfaChallenge.updateMany({
        where: { userId: record.userId, consumedAt: null },
        data: { consumedAt: now },
      });
      await tx.passwordResetToken.updateMany({
        where: {
          userId: record.userId,
          consumedAt: null,
          id: { not: record.id },
        },
        data: { consumedAt: now },
      });

      return sessions.count;
    });

    await this.audit.record({
      organisationId: record.user.organisationId,
      branchId: record.user.branchId,
      actorUserId: record.userId,
      actorLabel: record.user.email,
      action: 'Password reset',
      entityType: 'User',
      entityId: record.userId,
      after: { sessionsRevoked: revokedSessions },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  private invalidToken(): BadRequestException {
    return new BadRequestException(
      'This password reset link is invalid or has expired.',
    );
  }
}
