import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@aimscams/db';
import { Inject } from '@nestjs/common';
import { PRISMA } from '../prisma/prisma.module.js';
import type { PrismaClient } from '@aimscams/db';
import { AuditService } from '../auth/audit.service.js';
import { normalizeEmail, hashSessionToken } from '../auth/auth.crypto.js';
import { passwordPolicyError, hashPassword } from '../auth/password-policy.js';
import type { AuthContext } from '../auth/auth.types.js';

interface UserContext {
  ipAddress?: string;
  userAgent?: string;
}

interface ListUsersFilter {
  q?: string;
  status?: string;
  role?: string;
  branchId?: string;
}

interface CreateUserInput {
  email?: unknown;
  fullName?: unknown;
  phone?: unknown;
  branchId?: unknown;
  roleCodes?: unknown;
  status?: unknown;
  password?: unknown;
}

interface UpdateUserInput {
  fullName?: unknown;
  phone?: unknown;
  branchId?: unknown;
  roleCodes?: unknown;
  status?: unknown;
  password?: unknown;
}

interface UpdateRoleInput {
  name?: unknown;
  description?: unknown;
  permissionKeys?: unknown;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async listUsers(auth: AuthContext, filter: ListUsersFilter) {
    const organisationId = auth.user.organisation.id;
    const where: Prisma.UserWhereInput = { organisationId };

    if (filter.status) where.status = filter.status as any;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.role) {
      where.roles = { some: { role: { code: filter.role } } };
    }
    if (filter.q?.trim()) {
      const query = filter.q.trim();
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { fullName: { contains: query, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: [{ fullName: 'asc' }],
      include: {
        branch: { select: { id: true, code: true, name: true, status: true } },
        roles: { include: { role: { select: { code: true, name: true } } } },
      },
    });

    return users.map((user) => this.toUser(user));
  }

  async getUser(auth: AuthContext, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organisationId: auth.user.organisation.id },
      include: {
        branch: { select: { id: true, code: true, name: true, status: true } },
        roles: { include: { role: { select: { code: true, name: true } } } },
      },
    });
    if (!user) throw new NotFoundException('User not found.');
    return this.toUser(user);
  }

  async createUser(auth: AuthContext, body: CreateUserInput, context: UserContext) {
    const organisationId = auth.user.organisation.id;
    const email = normalizeEmail(String(body.email ?? ''));
    if (!email) throw new BadRequestException('Email is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('A valid email address is required.');
    }

    const fullName = String(body.fullName ?? '').trim();
    if (!fullName) throw new BadRequestException('Full name is required.');

    const phone = body.phone === undefined || body.phone === null
      ? null
      : String(body.phone).trim() || null;

    const password = typeof body.password === 'string' ? body.password : '';
    const passwordError = passwordPolicyError(password, email);
    if (passwordError) throw new BadRequestException(passwordError);

    const status = this.parseStatus(body.status, 'ACTIVE');

    const branchId = await this.validateBranch(organisationId, body.branchId);
    const roleCodes = this.parseRoleCodes(body.roleCodes);
    const roles = await this.loadRoles(organisationId, roleCodes);

    const existing = await this.prisma.user.findUnique({
      where: { organisationId_email: { organisationId, email } },
    });
    if (existing) throw new BadRequestException('A user with that email already exists.');

    const passwordHash = await hashPassword(password);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          organisationId,
          branchId,
          email,
          fullName,
          phone,
          passwordHash,
          status: status as any,
        },
      });
      if (roles.length > 0) {
        await tx.userRole.createMany({
          data: roles.map((role) => ({ userId: created.id, roleId: role.id })),
        });
      }
      return created;
    });

    const full = await this.getUser(auth, user.id);
    await this.audit.record({
      organisationId,
      branchId: user.branchId,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'User created',
      entityType: 'User',
      entityId: user.id,
      after: { email, fullName, status, roles: roleCodes },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return full;
  }

  async updateUser(
    auth: AuthContext,
    id: string,
    body: UpdateUserInput,
    context: UserContext,
  ) {
    const organisationId = auth.user.organisation.id;
    const target = await this.prisma.user.findFirst({
      where: { id, organisationId },
      include: {
        branch: { select: { id: true, code: true, name: true, status: true } },
        roles: { include: { role: { select: { code: true, name: true, id: true } } } },
      },
    });
    if (!target) throw new NotFoundException('User not found.');

    const isSelf = auth.user.id === id;
    const changingRoles = body.roleCodes !== undefined;
    const changingStatus = body.status !== undefined;

    if (isSelf && (changingRoles || changingStatus)) {
      throw new ForbiddenException('You cannot change your own roles or status.');
    }

    const before = this.toUser(target);
    const updates: Prisma.UserUpdateInput = {};
    const after: Record<string, unknown> = {};

    if (body.fullName !== undefined) {
      const fullName = String(body.fullName).trim();
      if (!fullName) throw new BadRequestException('Full name is required.');
      updates.fullName = fullName;
      after.fullName = fullName;
    }

    if (body.phone !== undefined) {
      const phone = body.phone === null ? null : String(body.phone).trim() || null;
      updates.phone = phone;
      after.phone = phone;
    }

    if (body.branchId !== undefined) {
      const branchId = await this.validateBranch(organisationId, body.branchId);
      updates.branch = branchId
        ? { connect: { id: branchId } }
        : { disconnect: true };
      after.branchId = branchId;
    }

    if (body.status !== undefined) {
      const status = this.parseStatus(body.status);
      updates.status = status as any;
    }

    if (body.password !== undefined && String(body.password).trim() !== '') {
      const password = String(body.password);
      const passwordError = passwordPolicyError(password, target.email);
      if (passwordError) throw new BadRequestException(passwordError);
      updates.passwordHash = await hashPassword(password);
      after.passwordChanged = true;
    }

    let roleCodes: string[] | undefined;
    if (changingRoles) {
      roleCodes = this.parseRoleCodes(body.roleCodes);
      const roles = await this.loadRoles(organisationId, roleCodes);
      if (target.roles.some((userRole) => userRole.role.code === 'ADMIN')) {
        const removingAdmin = !roleCodes.includes('ADMIN');
        const deactivating = body.status !== undefined && this.parseStatus(body.status) !== 'ACTIVE';
        if (removingAdmin || deactivating) {
          const otherAdmins = await this.prisma.user.count({
            where: {
              organisationId,
              id: { not: id },
              status: 'ACTIVE',
              roles: { some: { role: { code: 'ADMIN' } } },
            },
          });
          if (otherAdmins === 0) {
            throw new BadRequestException('At least one active administrator is required.');
          }
        }
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (roles.length > 0) {
          await tx.userRole.createMany({
            data: roles.map((role) => ({ userId: id, roleId: role.id })),
          });
        }
      });
      after.roles = roleCodes;
    }

    if (Object.keys(updates).length > 0) {
      await this.prisma.user.update({ where: { id }, data: updates });
    }

    if (body.status !== undefined && this.parseStatus(body.status) !== 'ACTIVE') {
      await this.prisma.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    const full = await this.getUser(auth, id);
    await this.audit.record({
      organisationId,
      branchId: target.branchId,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'User updated',
      entityType: 'User',
      entityId: id,
      before: this.toAuditUser(target),
      after: after as Prisma.InputJsonValue,
      userAgent: context.userAgent,
    });

    return full;
  }

  async unlockUser(auth: AuthContext, id: string, context: UserContext) {
    const organisationId = auth.user.organisation.id;
    if (auth.user.id === id) {
      throw new ForbiddenException('You cannot unlock your own account.');
    }

    const target = await this.prisma.user.findFirst({
      where: { id, organisationId },
    });
    if (!target) throw new NotFoundException('User not found.');

    await this.prisma.user.update({
      where: { id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });

    await this.audit.record({
      organisationId,
      branchId: target.branchId,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'User unlocked',
      entityType: 'User',
      entityId: id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { ok: true };
  }

  async listRoles(auth: AuthContext) {
    const organisationId = auth.user.organisation.id;
    const roles = await this.prisma.role.findMany({
      where: { organisationId },
      orderBy: { name: 'asc' },
      include: {
        permissions: { include: { permission: true } },
        users: { select: { userId: true } },
      },
    });

    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissionKeys: role.permissions.map((item) => item.permissionId),
      userCount: role.users.length,
    }));
  }

  async listBranches(auth: AuthContext) {
    const organisationId = auth.user.organisation.id;
    const branches = await this.prisma.branch.findMany({
      where: { organisationId },
      orderBy: [{ name: 'asc' }],
      select: { id: true, code: true, name: true, status: true, region: true },
    });
    return branches;
  }

  async updateRole(auth: AuthContext, id: string, body: UpdateRoleInput, context: UserContext) {
    const organisationId = auth.user.organisation.id;
    const role = await this.prisma.role.findFirst({
      where: { id, organisationId },
      include: { permissions: true },
    });
    if (!role) throw new NotFoundException('Role not found.');

    const updates: Prisma.RoleUpdateInput = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) throw new BadRequestException('Role name is required.');
      updates.name = name;
    }
    if (body.description !== undefined) {
      updates.description = body.description === null ? null : String(body.description).trim();
    }

    if (Object.keys(updates).length > 0) {
      await this.prisma.role.update({ where: { id }, data: updates });
    }

    if (body.permissionKeys !== undefined) {
      const permissionKeys = Array.isArray(body.permissionKeys)
        ? body.permissionKeys.map((item) => String(item))
        : [];
      const permissions = await this.prisma.permission.findMany({
        where: { key: { in: permissionKeys } },
        select: { key: true },
      });
      if (permissions.length !== permissionKeys.length) {
        throw new BadRequestException('One or more permissions do not exist.');
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (permissionKeys.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionKeys.map((permissionId) => ({ roleId: id, permissionId })),
          });
        }
      });
    }

    const full = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        users: { select: { userId: true } },
      },
    });

    await this.audit.record({
      organisationId,
      branchId: null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Role updated',
      entityType: 'Role',
      entityId: id,
      after: {
        name: full?.name,
        permissionKeys: full?.permissions.map((item) => item.permissionId),
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      id: full!.id,
      code: full!.code,
      name: full!.name,
      description: full!.description,
      isSystem: full!.isSystem,
      permissionKeys: full!.permissions.map((item) => item.permissionId),
      userCount: full!.users.length,
    };
  }

  private parseStatus(value: unknown, fallback?: string): string {
    const status = String(value ?? fallback ?? '').trim().toUpperCase();
    if (!['ACTIVE', 'INACTIVE', 'LOCKED'].includes(status)) {
      throw new BadRequestException('Status must be ACTIVE, INACTIVE, or LOCKED.');
    }
    return status;
  }

  private parseRoleCodes(value: unknown): string[] {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) {
      throw new BadRequestException('roleCodes must be an array.');
    }
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }

  private async validateBranch(organisationId: string, value: unknown): Promise<string | null> {
    if (value === undefined || value === null || value === '') return null;
    const branchId = String(value);
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, organisationId },
      select: { id: true },
    });
    if (!branch) throw new BadRequestException('Branch does not belong to this institution.');
    return branchId;
  }

  private async loadRoles(organisationId: string, roleCodes: string[]) {
    if (roleCodes.length === 0) return [];
    const roles = await this.prisma.role.findMany({
      where: { organisationId, code: { in: roleCodes } },
      select: { id: true, code: true },
    });
    if (roles.length !== roleCodes.length) {
      throw new BadRequestException('One or more roles do not exist.');
    }
    return roles;
  }

  private toUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      status: user.status,
      branch: user.branch
        ? { id: user.branch.id, code: user.branch.code, name: user.branch.name, status: user.branch.status }
        : null,
      roles: (user.roles ?? []).map((userRole: any) => ({
        code: userRole.role.code,
        name: userRole.role.name,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toAuditUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      status: user.status,
      branchId: user.branch?.id ?? user.branchId ?? null,
      roles: (user.roles ?? []).map((userRole: any) => userRole.role.code),
    };
  }
}
