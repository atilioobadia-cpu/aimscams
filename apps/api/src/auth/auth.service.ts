import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from '@node-rs/argon2';
import { Prisma, type PrismaClient } from '@aimscams/db';
import { PRISMA } from '../prisma/prisma.module.js';
import {
  LAST_SEEN_UPDATE_MS,
  LOCKOUT_MS,
  LOGIN_WINDOW_MS,
  MAX_FAILED_LOGINS,
  MAX_FAILED_LOGINS_PER_IP,
  MFA_CHALLENGE_TTL_MS,
  MFA_RECOVERY_CODE_COUNT,
  SESSION_TTL_MS,
} from './auth.constants.js';
import {
  generateToken,
  hashSessionToken,
  normalizeEmail,
} from './auth.crypto.js';
import type {
  AuthContext,
  AuthUser,
  LoginResponse,
  LoginResult,
  MfaEnrollment,
  MfaStatus,
} from './auth.types.js';
import { AuditService } from './audit.service.js';
import { requiresMfaEnrollment } from './mfa-policy.js';
import {
  decryptMfaSecret,
  encryptMfaSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  normalizeRecoveryCode,
  totpUri,
  verifyTotp,
} from './totp.js';

export interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
}

interface MfaSecretRecord {
  encryptedSecret: string;
  recoveryCodeHashes: string[];
  lastUsedCounter: number | null;
}

type MfaCodeVerification =
  { kind: 'totp'; counter: number } | { kind: 'recovery'; codeHash: string };

const userInclude = {
  organisation: true,
  branch: true,
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

type SessionUser = Prisma.UserGetPayload<{ include: typeof userInclude }>;

@Injectable()
export class AuthService {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async login(
    emailInput: string,
    password: string,
    context: LoginContext,
  ): Promise<LoginResponse> {
    const email = normalizeEmail(emailInput);
    const now = new Date();

    if (context.ipAddress) {
      const failuresFromIp = await this.prisma.loginAttempt.count({
        where: {
          ipAddress: context.ipAddress,
          succeeded: false,
          createdAt: { gte: new Date(now.getTime() - LOGIN_WINDOW_MS) },
        },
      });
      if (failuresFromIp >= MAX_FAILED_LOGINS_PER_IP) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many login attempts. Try again later.',
            code: 'IP_THROTTLED',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const user = await this.prisma.user.findFirst({
      where: { email },
      include: userInclude,
    });

    if (!user) {
      await this.recordAttempt({
        email,
        succeeded: false,
        reason: 'unknown_user',
        context,
      });
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
      await this.recordAttempt({
        email,
        organisationId: user.organisationId,
        branchId: user.branchId,
        userId: user.id,
        succeeded: false,
        reason: 'locked',
        context,
      });
      throw this.lockedException();
    }

    if (user.status !== 'ACTIVE') {
      await this.recordAttempt({
        email,
        organisationId: user.organisationId,
        branchId: user.branchId,
        userId: user.id,
        succeeded: false,
        reason: 'inactive',
        context,
      });
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await verify(user.passwordHash, password).catch(
      () => false,
    );
    if (!passwordMatches) {
      await this.recordFailure(user, context);
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.mfaEnabled) {
      return this.issueMfaChallenge(user, context);
    }

    const result = await this.prisma.$transaction((tx) =>
      this.issueSession(user, context, tx),
    );
    await this.auditLoginSuccess(user, result, context);
    return result;
  }

  async completeMfaChallenge(
    challengeToken: string,
    code: string,
    context: LoginContext,
  ): Promise<LoginResult> {
    const now = new Date();
    const challenge = await this.prisma.mfaChallenge.findUnique({
      where: { tokenHash: hashSessionToken(challengeToken) },
      include: {
        user: { include: userInclude },
      },
    });

    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt.getTime() <= now.getTime()
    ) {
      throw new UnauthorizedException(
        'This authentication challenge has expired. Sign in again.',
      );
    }

    const user = challenge.user;
    if (user.status !== 'ACTIVE') {
      await this.recordAttempt({
        email: user.email,
        organisationId: user.organisationId,
        branchId: user.branchId,
        userId: user.id,
        succeeded: false,
        reason: 'inactive',
        context,
      });
      throw new UnauthorizedException('Invalid authentication code.');
    }
    if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
      await this.recordAttempt({
        email: user.email,
        organisationId: user.organisationId,
        branchId: user.branchId,
        userId: user.id,
        succeeded: false,
        reason: 'locked',
        context,
      });
      throw this.lockedException();
    }

    const secret = await this.prisma.mfaSecret.findUnique({
      where: { userId: user.id },
    });
    if (!secret) {
      await this.recordFailure(user, context, 'mfa_missing');
      throw new UnauthorizedException('Invalid authentication code.');
    }

    const verification = this.verifyMfaCode(secret, code);
    if (!verification) {
      await this.recordFailure(user, context, 'mfa_failed');
      throw new UnauthorizedException('Invalid authentication code.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.mfaChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        throw new UnauthorizedException(
          'This authentication challenge has already been used.',
        );
      }

      if (verification.kind === 'totp') {
        const updated = await tx.mfaSecret.updateMany({
          where: {
            userId: user.id,
            OR: [
              { lastUsedCounter: null },
              { lastUsedCounter: { lt: verification.counter } },
            ],
          },
          data: { lastUsedCounter: verification.counter },
        });
        if (updated.count !== 1) {
          throw new UnauthorizedException(
            'This authentication code has already been used.',
          );
        }
      } else {
        // Remove the code atomically. Reading the array and writing it back
        // would let two concurrent logins consume different codes and lose one
        // of the updates.
        const updated = await tx.$executeRaw`
          UPDATE "mfa_secret"
          SET "recoveryCodeHashes" = array_remove("recoveryCodeHashes", ${verification.codeHash}),
              "updatedAt" = NOW()
          WHERE "userId" = ${user.id}::uuid
            AND ${verification.codeHash} = ANY("recoveryCodeHashes")
        `;
        if (updated !== 1) {
          throw new UnauthorizedException(
            'This recovery code has already been used.',
          );
        }
      }

      return this.issueSession(user, context, tx);
    });

    await this.auditLoginSuccess(user, result, context);
    if (verification.kind === 'recovery') {
      await this.audit.record({
        organisationId: user.organisationId,
        branchId: user.branchId,
        actorUserId: user.id,
        actorLabel: user.email,
        action: 'Recovery code used',
        entityType: 'User',
        entityId: user.id,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    }

    return result;
  }

  async getMfaStatus(userId: string): Promise<MfaStatus> {
    const [user, secret] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { mfaEnabled: true },
      }),
      this.prisma.mfaSecret.findUnique({ where: { userId } }),
    ]);

    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    return {
      enabled: user.mfaEnabled,
      pending: Boolean(secret) && !user.mfaEnabled,
      recoveryCodesRemaining: secret?.recoveryCodeHashes.length ?? 0,
    };
  }

  async enrollMfa(
    userId: string,
    context: LoginContext,
  ): Promise<MfaEnrollment> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }
    if (user.mfaEnabled) {
      throw new ConflictException(
        'Multi-factor authentication is already enabled.',
      );
    }

    const secret = generateTotpSecret();
    const recoveryCodes = generateRecoveryCodes(MFA_RECOVERY_CODE_COUNT);
    const recoveryCodeHashes = recoveryCodes.map((code) =>
      hashSessionToken(normalizeRecoveryCode(code)),
    );

    await this.prisma.mfaSecret.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        encryptedSecret: encryptMfaSecret(secret),
        recoveryCodeHashes,
      },
      update: {
        encryptedSecret: encryptMfaSecret(secret),
        recoveryCodeHashes,
        lastUsedCounter: null,
      },
    });

    await this.audit.record({
      organisationId: user.organisationId,
      branchId: user.branchId,
      actorUserId: user.id,
      actorLabel: user.email,
      action: 'MFA enrollment started',
      entityType: 'User',
      entityId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      secret,
      otpauthUri: totpUri({ secret, email: user.email }),
      recoveryCodes,
    };
  }

  async activateMfa(
    userId: string,
    sessionId: string,
    code: string,
    context: LoginContext,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }
    if (user.mfaEnabled) {
      throw new ConflictException(
        'Multi-factor authentication is already enabled.',
      );
    }

    const secret = await this.prisma.mfaSecret.findUnique({
      where: { userId: user.id },
    });
    if (!secret) {
      throw new BadRequestException(
        'Start MFA enrollment before activating it.',
      );
    }

    let totpSecret: string;
    try {
      totpSecret = decryptMfaSecret(secret.encryptedSecret);
    } catch {
      throw new BadRequestException(
        'The MFA secret cannot be read. Enroll again.',
      );
    }

    const verification = verifyTotp(totpSecret, code);
    if (
      !verification ||
      (secret.lastUsedCounter !== null &&
        verification.counter <= secret.lastUsedCounter)
    ) {
      throw new UnauthorizedException('Invalid authentication code.');
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.mfaSecret.updateMany({
        where: {
          userId: user.id,
          OR: [
            { lastUsedCounter: null },
            { lastUsedCounter: { lt: verification.counter } },
          ],
        },
        data: { lastUsedCounter: verification.counter },
      });
      if (consumed.count !== 1) {
        throw new UnauthorizedException(
          'This authentication code has already been used.',
        );
      }

      await tx.user.update({
        where: { id: user.id },
        data: { mfaEnabled: true },
      });
      await tx.session.updateMany({
        where: {
          userId: user.id,
          id: { not: sessionId },
          revokedAt: null,
        },
        data: { revokedAt: now },
      });
    });

    await this.audit.record({
      organisationId: user.organisationId,
      branchId: user.branchId,
      actorUserId: user.id,
      actorLabel: user.email,
      action: 'MFA enabled',
      entityType: 'User',
      entityId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  async regenerateRecoveryCodes(
    userId: string,
    password: string,
    code: string,
    context: LoginContext,
  ): Promise<string[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }
    if (!(await verify(user.passwordHash, password).catch(() => false))) {
      throw new UnauthorizedException(
        'Invalid password or authentication code.',
      );
    }

    const secret = await this.prisma.mfaSecret.findUnique({
      where: { userId: user.id },
    });
    if (!secret || !user.mfaEnabled) {
      throw new BadRequestException(
        'Multi-factor authentication is not enabled.',
      );
    }
    const counter = this.verifyTotpCounter(secret, code);
    if (counter === null) {
      throw new UnauthorizedException(
        'Invalid password or authentication code.',
      );
    }

    const recoveryCodes = generateRecoveryCodes(MFA_RECOVERY_CODE_COUNT);
    const updated = await this.prisma.mfaSecret.updateMany({
      where: {
        userId: user.id,
        OR: [{ lastUsedCounter: null }, { lastUsedCounter: { lt: counter } }],
      },
      data: {
        lastUsedCounter: counter,
        recoveryCodeHashes: recoveryCodes.map((item) =>
          hashSessionToken(normalizeRecoveryCode(item)),
        ),
      },
    });
    if (updated.count !== 1) {
      throw new UnauthorizedException(
        'This authentication code has already been used.',
      );
    }

    await this.audit.record({
      organisationId: user.organisationId,
      branchId: user.branchId,
      actorUserId: user.id,
      actorLabel: user.email,
      action: 'Recovery codes regenerated',
      entityType: 'User',
      entityId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return recoveryCodes;
  }

  async disableMfa(
    userId: string,
    sessionId: string,
    password: string,
    code: string,
    context: LoginContext,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }
    if (!user.mfaEnabled) {
      throw new BadRequestException(
        'Multi-factor authentication is not enabled.',
      );
    }
    if (!(await verify(user.passwordHash, password).catch(() => false))) {
      throw new UnauthorizedException(
        'Invalid password or authentication code.',
      );
    }

    const secret = await this.prisma.mfaSecret.findUnique({
      where: { userId: user.id },
    });
    if (!secret || !this.verifyMfaCode(secret, code)) {
      throw new UnauthorizedException(
        'Invalid password or authentication code.',
      );
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.mfaSecret.delete({ where: { userId: user.id } }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { mfaEnabled: false },
      }),
      this.prisma.session.updateMany({
        where: {
          userId: user.id,
          id: { not: sessionId },
          revokedAt: null,
        },
        data: { revokedAt: now },
      }),
    ]);

    await this.audit.record({
      organisationId: user.organisationId,
      branchId: user.branchId,
      actorUserId: user.id,
      actorLabel: user.email,
      action: 'MFA disabled',
      entityType: 'User',
      entityId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  async getSession(sessionToken: string): Promise<AuthContext | null> {
    const tokenHash = hashSessionToken(sessionToken);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: userInclude,
        },
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      return null;
    }

    const user = session.user;
    if (
      user.status !== 'ACTIVE' ||
      (user.lockedUntil && user.lockedUntil.getTime() > Date.now())
    ) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      return null;
    }

    if (Date.now() - session.lastSeenAt.getTime() > LAST_SEEN_UPDATE_MS) {
      await this.prisma.session
        .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
        .catch(() => undefined);
    }

    return {
      sessionId: session.id,
      sessionExpiresAt: session.expiresAt,
      user: this.toAuthUser(user),
    };
  }

  async logout(sessionToken: string, context: LoginContext): Promise<void> {
    const tokenHash = hashSessionToken(sessionToken);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!session || session.revokedAt) {
      return;
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    await this.audit.record({
      organisationId: session.user.organisationId,
      branchId: session.user.branchId,
      actorUserId: session.user.id,
      actorLabel: session.user.email,
      action: 'Logout',
      entityType: 'Session',
      entityId: session.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  private async issueMfaChallenge(
    user: SessionUser,
    context: LoginContext,
  ): Promise<LoginResponse> {
    const now = new Date();
    const challengeToken = generateToken();
    const expiresAt = new Date(now.getTime() + MFA_CHALLENGE_TTL_MS);

    await this.prisma.mfaChallenge.deleteMany({
      where: { userId: user.id, expiresAt: { lt: now } },
    });
    await this.prisma.mfaChallenge.create({
      data: {
        userId: user.id,
        tokenHash: hashSessionToken(challengeToken),
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
        expiresAt,
      },
    });

    await this.audit.record({
      organisationId: user.organisationId,
      branchId: user.branchId,
      actorUserId: user.id,
      actorLabel: user.email,
      action: 'MFA challenge issued',
      entityType: 'User',
      entityId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { mfaRequired: true, challengeToken, expiresAt };
  }

  private async issueSession(
    user: SessionUser,
    context: LoginContext,
    tx: Prisma.TransactionClient,
  ): Promise<LoginResult> {
    const now = new Date();
    const sessionToken = generateToken();
    const csrfToken = generateToken(24);
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

    await tx.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: now,
      },
    });
    await tx.loginAttempt.create({
      data: {
        email: user.email,
        organisationId: user.organisationId,
        userId: user.id,
        succeeded: true,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
      },
    });
    const session = await tx.session.create({
      data: {
        userId: user.id,
        branchId: user.branchId,
        tokenHash: hashSessionToken(sessionToken),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        expiresAt,
        lastSeenAt: now,
      },
    });

    return {
      sessionToken,
      csrfToken,
      sessionId: session.id,
      expiresAt,
      user: this.toAuthUser(user),
    };
  }

  private async auditLoginSuccess(
    user: SessionUser,
    result: LoginResult,
    context: LoginContext,
  ): Promise<void> {
    await this.audit.record({
      organisationId: user.organisationId,
      branchId: user.branchId,
      actorUserId: user.id,
      actorLabel: user.email,
      action: 'Login success',
      entityType: 'Session',
      entityId: result.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  private verifyMfaCode(
    secret: MfaSecretRecord,
    code: string,
  ): MfaCodeVerification | null {
    const normalized = code.replace(/\s+/g, '');
    if (/^\d{6}$/.test(normalized)) {
      let totpSecret: string;
      try {
        totpSecret = decryptMfaSecret(secret.encryptedSecret);
      } catch {
        return null;
      }
      const verification = verifyTotp(totpSecret, normalized);
      if (
        !verification ||
        (secret.lastUsedCounter !== null &&
          verification.counter <= secret.lastUsedCounter)
      ) {
        return null;
      }
      return { kind: 'totp', counter: verification.counter };
    }

    const codeHash = hashSessionToken(normalizeRecoveryCode(code));
    return secret.recoveryCodeHashes.includes(codeHash)
      ? { kind: 'recovery', codeHash }
      : null;
  }

  private verifyTotpCounter(
    secret: MfaSecretRecord,
    code: string,
  ): number | null {
    let totpSecret: string;
    try {
      totpSecret = decryptMfaSecret(secret.encryptedSecret);
    } catch {
      return null;
    }
    const verification = verifyTotp(totpSecret, code);
    if (
      !verification ||
      (secret.lastUsedCounter !== null &&
        verification.counter <= secret.lastUsedCounter)
    ) {
      return null;
    }
    return verification.counter;
  }

  private lockedException(): HttpException {
    return new HttpException(
      {
        statusCode: HttpStatus.LOCKED,
        message: 'Too many failed attempts. Try again later.',
        code: 'ACCOUNT_LOCKED',
      },
      HttpStatus.LOCKED,
    );
  }

  private async recordFailure(
    user: SessionUser,
    context: LoginContext,
    reason = 'bad_password',
  ): Promise<void> {
    const now = new Date();
    await this.recordAttempt({
      email: user.email,
      organisationId: user.organisationId,
      branchId: user.branchId,
      userId: user.id,
      succeeded: false,
      reason,
      context,
    });

    const failuresInWindow = await this.prisma.loginAttempt.count({
      where: {
        email: user.email,
        succeeded: false,
        createdAt: { gte: new Date(now.getTime() - LOGIN_WINDOW_MS) },
      },
    });

    if (failuresInWindow >= MAX_FAILED_LOGINS) {
      const lockedUntil = new Date(now.getTime() + LOCKOUT_MS);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: failuresInWindow, lockedUntil },
      });
      await this.audit.record({
        organisationId: user.organisationId,
        branchId: user.branchId,
        actorUserId: user.id,
        actorLabel: user.email,
        action: 'Locked out',
        entityType: 'User',
        entityId: user.id,
        after: {
          lockedUntil: lockedUntil.toISOString(),
          failures: failuresInWindow,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      return;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: failuresInWindow },
    });
  }

  private async recordAttempt(input: {
    email: string;
    organisationId?: string;
    branchId?: string | null;
    userId?: string;
    succeeded: boolean;
    reason: string;
    context: LoginContext;
  }): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: {
        email: input.email,
        organisationId: input.organisationId ?? null,
        userId: input.userId ?? null,
        succeeded: input.succeeded,
        reason: input.reason,
        ipAddress: input.context.ipAddress ?? null,
        userAgent: input.context.userAgent ?? null,
      },
    });

    if (input.organisationId) {
      await this.audit.record({
        organisationId: input.organisationId,
        branchId: input.branchId ?? null,
        actorUserId: input.userId ?? null,
        actorLabel: input.email,
        action: input.reason === 'locked' ? 'Locked out' : 'Login failed',
        entityType: 'User',
        entityId: input.userId ?? null,
        after: { reason: input.reason },
        ipAddress: input.context.ipAddress,
        userAgent: input.context.userAgent,
      });
    }
  }

  private toAuthUser(user: SessionUser): AuthUser {
    const permissions = [
      ...new Set(
        user.roles.flatMap((userRole) =>
          userRole.role.permissions.map(
            (rolePermission) => rolePermission.permission.key,
          ),
        ),
      ),
    ].sort();
    const roles = user.roles
      .map((userRole) => ({
        code: userRole.role.code,
        name: userRole.role.name,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    const mfaEnrollmentRequired = requiresMfaEnrollment({
      mfaEnabled: user.mfaEnabled,
      roles,
      permissions,
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      status: user.status,
      mfaEnabled: user.mfaEnabled,
      mfaEnrollmentRequired,
      organisation: {
        id: user.organisation.id,
        code: user.organisation.code,
        name: user.organisation.name,
        dialect: user.organisation.dialect,
      },
      branch: user.branch
        ? { id: user.branch.id, code: user.branch.code, name: user.branch.name }
        : null,
      roles,
      permissions,
    };
  }
}
