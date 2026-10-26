import {
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
  SESSION_TTL_MS,
} from './auth.constants.js';
import {
  generateToken,
  hashSessionToken,
  normalizeEmail,
} from './auth.crypto.js';
import type { AuthContext, AuthUser, LoginResult } from './auth.types.js';
import { AuditService } from './audit.service.js';

export interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
}

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
  ): Promise<LoginResult> {
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
      throw new HttpException(
        {
          statusCode: HttpStatus.LOCKED,
          message: 'Too many failed attempts. Try again later.',
          code: 'ACCOUNT_LOCKED',
        },
        HttpStatus.LOCKED,
      );
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
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Multi-factor authentication is required.',
          code: 'MFA_REQUIRED',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const sessionToken = generateToken();
    const csrfToken = generateToken(24);
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

    const session = await this.prisma.$transaction(async (tx) => {
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
      return tx.session.create({
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
    });

    await this.audit.record({
      organisationId: user.organisationId,
      branchId: user.branchId,
      actorUserId: user.id,
      actorLabel: user.email,
      action: 'Login success',
      entityType: 'Session',
      entityId: session.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      sessionToken,
      csrfToken,
      expiresAt,
      user: this.toAuthUser(user),
    };
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

  private async recordFailure(
    user: SessionUser,
    context: LoginContext,
  ): Promise<void> {
    const now = new Date();
    await this.recordAttempt({
      email: user.email,
      organisationId: user.organisationId,
      branchId: user.branchId,
      userId: user.id,
      succeeded: false,
      reason: 'bad_password',
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

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      status: user.status,
      mfaEnabled: user.mfaEnabled,
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
