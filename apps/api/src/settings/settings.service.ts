import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type PrismaClient } from '@aimscams/db';

import { AuditService } from '../auth/audit.service.js';
import type { AuthContext } from '../auth/auth.types.js';
import { PRISMA } from '../prisma/prisma.module.js';
import {
  defaultBranchHours,
  normaliseBranchCode,
  optionalText,
  parseBranchStatus,
  parseCouncilType,
  parseHours,
  parseInteger,
  parseLogoDataUrl,
  requiredText,
  resolveLogoUrl,
  textValue,
} from './settings.logic.js';

interface MutationContext {
  ipAddress?: string;
  userAgent?: string;
}

interface OrganisationInput {
  name?: unknown;
  registrationNo?: unknown;
  dialect?: unknown;
  timezone?: unknown;
  logoUrl?: unknown;
  defaultBranchId?: unknown;
}

interface BranchInput {
  code?: unknown;
  name?: unknown;
  addressLine?: unknown;
  region?: unknown;
  district?: unknown;
  ward?: unknown;
  councilType?: unknown;
  employeeCount?: unknown;
  status?: unknown;
  isDefault?: unknown;
  hours?: unknown;
}

type BranchRecord = Prisma.BranchGetPayload<{
  include: { hours: true; _count: { select: { users: true } } };
}>;

const ORGANISATION_SELECT = {
  id: true,
  code: true,
  name: true,
  registrationNo: true,
  dialect: true,
  timezone: true,
  locale: true,
  logoUrl: true,
  logoUpdatedAt: true,
  updatedAt: true,
  branches: {
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      isDefault: true,
    },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  },
} satisfies Prisma.OrganisationSelect;

const BRANCH_INCLUDE = {
  hours: { orderBy: { weekday: 'asc' } },
  _count: { select: { users: true } },
} satisfies Prisma.BranchInclude;

@Injectable()
export class SettingsService {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async getOrganisation(auth: AuthContext) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: auth.user.organisation.id },
      select: ORGANISATION_SELECT,
    });
    if (!organisation) throw new NotFoundException('Organisation not found.');

    const defaultBranch = organisation.branches.find((branch) => branch.isDefault);
    return {
      id: organisation.id,
      code: organisation.code,
      name: organisation.name,
      registrationNo: organisation.registrationNo,
      dialect: organisation.dialect,
      timezone: organisation.timezone,
      locale: organisation.locale,
      logoUrl: resolveLogoUrl(organisation.logoUrl, organisation.logoUpdatedAt),
      logoUpdatedAt: organisation.logoUpdatedAt,
      updatedAt: organisation.updatedAt,
      defaultBranchId: defaultBranch?.id ?? null,
      branches: organisation.branches,
      canEdit: this.can(auth, 'Settings Organisation : Edit'),
    };
  }

  async updateOrganisation(
    auth: AuthContext,
    body: OrganisationInput,
    context: MutationContext,
  ) {
    const organisationId = auth.user.organisation.id;
    const before = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: ORGANISATION_SELECT,
    });
    if (!before) throw new NotFoundException('Organisation not found.');

    const updates: Prisma.OrganisationUpdateInput = {};

    if (body.name !== undefined) {
      updates.name = requiredText(body.name, 'Legal name');
    }
    if (body.registrationNo !== undefined) {
      updates.registrationNo = optionalText(body.registrationNo);
    }
    if (body.dialect !== undefined) {
      const dialect = textValue(body.dialect).trim().toUpperCase();
      if (dialect !== 'TCDC' && dialect !== 'BOT') {
        throw new BadRequestException('Dialect must be TCDC or BOT.');
      }
      updates.dialect = dialect;
    }
    if (body.timezone !== undefined) {
      const timezone = requiredText(body.timezone, 'Time zone');
      try {
        new Intl.DateTimeFormat('en', { timeZone: timezone });
      } catch {
        throw new BadRequestException('Time zone is not a recognised IANA zone.');
      }
      updates.timezone = timezone;
    }
    if (body.logoUrl !== undefined) {
      const external = optionalText(body.logoUrl);
      if (external) {
        if (external.length > 500) {
          throw new BadRequestException('Logo URL must be 500 characters or fewer.');
        }
        let url: URL;
        try {
          url = new URL(external);
        } catch {
          throw new BadRequestException('Logo URL must be an absolute http or https URL.');
        }
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          throw new BadRequestException('Logo URL must use http or https.');
        }
        updates.logoUrl = url.toString();
        updates.logoMime = null;
        updates.logoData = null;
        updates.logoUpdatedAt = null;
      } else {
        updates.logoUrl = null;
      }
    }

    let defaultBranchId: string | null = null;
    if (body.defaultBranchId !== undefined) {
      const requested = optionalText(body.defaultBranchId);
      if (!requested) throw new BadRequestException('Select a default branch.');
      const branch = before.branches.find((item) => item.id === requested);
      if (!branch) {
        throw new BadRequestException('Default branch does not belong to this institution.');
      }
      if (branch.status !== 'OPEN') {
        throw new BadRequestException('The default branch must be open.');
      }
      if (!branch.isDefault) defaultBranchId = branch.id;
    }

    await this.prisma.$transaction(async (tx) => {
      if (defaultBranchId) {
        await tx.branch.updateMany({
          where: { organisationId, isDefault: true },
          data: { isDefault: false },
        });
        await tx.branch.updateMany({
          where: { organisationId, id: defaultBranchId },
          data: { isDefault: true },
        });
      }
      if (Object.keys(updates).length > 0) {
        await tx.organisation.update({ where: { id: organisationId }, data: updates });
      }
    });

    const after = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: ORGANISATION_SELECT,
    });

    await this.audit.record({
      organisationId,
      branchId: defaultBranchId ?? auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Organisation settings updated',
      entityType: 'Organisation',
      entityId: organisationId,
      before: this.organisationAudit(before),
      after: this.organisationAudit(after),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return this.getOrganisation(auth);
  }

  async getLogo(organisationId: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { logoMime: true, logoData: true },
    });
    if (!organisation?.logoMime || !organisation.logoData) {
      throw new NotFoundException('No uploaded logo.');
    }
    return {
      mime: organisation.logoMime,
      data: Buffer.from(organisation.logoData),
    };
  }

  async uploadLogo(auth: AuthContext, body: { dataUrl?: unknown }, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const logo = parseLogoDataUrl(body.dataUrl);
    const logoUpdatedAt = new Date();

    await this.prisma.organisation.update({
      where: { id: organisationId },
      data: {
        logoUrl: null,
        logoMime: logo.mime,
        logoData: Uint8Array.from(logo.data),
        logoUpdatedAt,
      },
    });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Organisation logo uploaded',
      entityType: 'Organisation',
      entityId: organisationId,
      after: { mime: logo.mime, bytes: logo.data.length, logoUpdatedAt: logoUpdatedAt.toISOString() },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return this.getOrganisation(auth);
  }

  async deleteLogo(auth: AuthContext, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    await this.prisma.organisation.update({
      where: { id: organisationId },
      data: {
        logoUrl: null,
        logoMime: null,
        logoData: null,
        logoUpdatedAt: null,
      },
    });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Organisation logo removed',
      entityType: 'Organisation',
      entityId: organisationId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return this.getOrganisation(auth);
  }

  async listBranches(auth: AuthContext, filter: { q?: string; status?: string }) {
    const organisationId = auth.user.organisation.id;
    const where: Prisma.BranchWhereInput = { organisationId };

    if (filter.status) where.status = parseBranchStatus(filter.status);
    const query = filter.q?.trim();
    if (query) {
      where.OR = [
        { code: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
        { region: { contains: query, mode: 'insensitive' } },
        { district: { contains: query, mode: 'insensitive' } },
      ];
    }

    const branches = await this.prisma.branch.findMany({
      where,
      include: BRANCH_INCLUDE,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return {
      items: branches.map((branch) => this.serializeBranch(branch)),
      canCreate: this.can(auth, 'Settings Branch : Create'),
      canEdit: this.can(auth, 'Settings Branch : Edit'),
    };
  }

  async getBranch(auth: AuthContext, id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, organisationId: auth.user.organisation.id },
      include: BRANCH_INCLUDE,
    });
    if (!branch) throw new NotFoundException('Branch not found.');

    return {
      branch: this.serializeBranch(branch),
      canEdit: this.can(auth, 'Settings Branch : Edit'),
    };
  }

  async listLoanProducts(auth: AuthContext, filter: { q?: string; status?: string }) {
    const organisationId = auth.user.organisation.id;
    const where: Prisma.LoanProductWhereInput = { organisationId };
    if (filter.status) {
      const status = filter.status.trim().toUpperCase();
      if (status === 'DRAFT' || status === 'ACTIVE' || status === 'INACTIVE') {
        where.status = status as 'DRAFT' | 'ACTIVE' | 'INACTIVE';
      }
    }
    const query = filter.q?.trim();
    if (query) {
      where.OR = [
        { code: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }
    const products = await this.prisma.loanProduct.findMany({
      where,
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
    return {
      items: products.map((product) => this.serializeLoanProduct(product)),
      canView: this.can(auth, 'Settings Product : View'),
      canEdit: this.can(auth, 'Settings Product : Edit'),
    };
  }

  async getLoanProduct(auth: AuthContext, id: string) {
    const product = await this.prisma.loanProduct.findFirst({
      where: { id, organisationId: auth.user.organisation.id },
    });
    if (!product) throw new NotFoundException('Loan product not found.');
    return {
      product: this.serializeLoanProduct(product),
      canEdit: this.can(auth, 'Settings Product : Edit'),
    };
  }

  async listSavingsProducts(auth: AuthContext, filter: { q?: string; status?: string }) {
    const organisationId = auth.user.organisation.id;
    const where: Prisma.SavingsProductWhereInput = { organisationId };
    if (filter.status) {
      const status = filter.status.trim().toUpperCase();
      if (status === 'DRAFT' || status === 'ACTIVE' || status === 'INACTIVE') {
        where.status = status as 'DRAFT' | 'ACTIVE' | 'INACTIVE';
      }
    }
    const query = filter.q?.trim();
    if (query) {
      where.OR = [
        { code: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }
    const products = await this.prisma.savingsProduct.findMany({
      where,
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
    return {
      items: products.map((product) => this.serializeSavingsProduct(product)),
      canView: this.can(auth, 'Settings Product : View'),
      canEdit: this.can(auth, 'Settings Product : Edit'),
    };
  }

  async getSavingsProduct(auth: AuthContext, id: string) {
    const product = await this.prisma.savingsProduct.findFirst({
      where: { id, organisationId: auth.user.organisation.id },
    });
    if (!product) throw new NotFoundException('Savings product not found.');
    return {
      product: this.serializeSavingsProduct(product),
      canEdit: this.can(auth, 'Settings Product : Edit'),
    };
  }

  async createSavingsProduct(auth: AuthContext, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const code = String(body.code ?? '').trim().toUpperCase();
    const name = String(body.name ?? '').trim();
    if (!code) throw new BadRequestException('Code is required.');
    if (!name) throw new BadRequestException('Name is required.');
    const status = String(body.status ?? 'DRAFT').trim().toUpperCase();
    if (status !== 'DRAFT' && status !== 'ACTIVE' && status !== 'INACTIVE') {
      throw new BadRequestException('Status must be DRAFT, ACTIVE or INACTIVE.');
    }

    const existing = await this.prisma.savingsProduct.findUnique({
      where: { organisationId_code: { organisationId, code } },
      select: { id: true },
    });
    if (existing) throw new ConflictException('A savings product with that code already exists.');

    const product = await this.prisma.savingsProduct.create({
      data: {
        organisationId,
        code,
        name,
        status: status as 'DRAFT' | 'ACTIVE' | 'INACTIVE',
        description: body.description ? String(body.description).trim() : null,
        allowedAsGuarantor: body.allowedAsGuarantor === true,
        allowedAsCollateral: body.allowedAsCollateral === true,
        allowedMultipleAccounts: body.allowedMultipleAccounts === true,
        allowInterestPayout: body.allowInterestPayout === true,
        minBalanceMinor: BigInt(String(body.minBalanceMinor ?? '0')),
        interestRateBp: Number(body.interestRateBp ?? 0),
        interestPayoutFrequency: String(body.interestPayoutFrequency ?? 'MONTHLY').trim() || 'MONTHLY',
      },
    });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Savings product created',
      entityType: 'SavingsProduct',
      entityId: product.id,
      before: undefined,
      after: this.serializeSavingsProduct(product),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { product: this.serializeSavingsProduct(product), canEdit: this.can(auth, 'Settings Product : Edit') };
  }

  async updateSavingsProduct(auth: AuthContext, id: string, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const before = await this.prisma.savingsProduct.findFirst({
      where: { id, organisationId },
    });
    if (!before) throw new NotFoundException('Savings product not found.');

    const data: Prisma.SavingsProductUpdateInput = {};
    if (body.code !== undefined) {
      const code = String(body.code).trim().toUpperCase();
      if (!code) throw new BadRequestException('Code is required.');
      data.code = code;
    }
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) throw new BadRequestException('Name is required.');
      data.name = name;
    }
    if (body.status !== undefined) {
      const status = String(body.status).trim().toUpperCase();
      if (status !== 'DRAFT' && status !== 'ACTIVE' && status !== 'INACTIVE') {
        throw new BadRequestException('Status must be DRAFT, ACTIVE or INACTIVE.');
      }
      data.status = status as 'DRAFT' | 'ACTIVE' | 'INACTIVE';
    }
    if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
    if (body.allowedAsGuarantor !== undefined) data.allowedAsGuarantor = body.allowedAsGuarantor === true;
    if (body.allowedAsCollateral !== undefined) data.allowedAsCollateral = body.allowedAsCollateral === true;
    if (body.allowedMultipleAccounts !== undefined) data.allowedMultipleAccounts = body.allowedMultipleAccounts === true;
    if (body.allowInterestPayout !== undefined) data.allowInterestPayout = body.allowInterestPayout === true;
    if (body.minBalanceMinor !== undefined) data.minBalanceMinor = BigInt(String(body.minBalanceMinor));
    if (body.interestRateBp !== undefined) data.interestRateBp = Number(body.interestRateBp);
    if (body.interestPayoutFrequency !== undefined) data.interestPayoutFrequency = String(body.interestPayoutFrequency).trim() || 'MONTHLY';

    const updated = await this.prisma.savingsProduct.update({ where: { id }, data });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Savings product updated',
      entityType: 'SavingsProduct',
      entityId: id,
      before: this.serializeSavingsProduct(before),
      after: this.serializeSavingsProduct(updated),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { product: this.serializeSavingsProduct(updated), canEdit: this.can(auth, 'Settings Product : Edit') };
  }

  private serializeSavingsProduct(product: Prisma.SavingsProductGetPayload<Record<string, never>>) {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      status: product.status,
      description: product.description,
      allowedAsGuarantor: product.allowedAsGuarantor,
      allowedAsCollateral: product.allowedAsCollateral,
      allowedMultipleAccounts: product.allowedMultipleAccounts,
      allowInterestPayout: product.allowInterestPayout,
      minBalanceMinor: product.minBalanceMinor.toString(),
      interestRateBp: product.interestRateBp,
      interestPayoutFrequency: product.interestPayoutFrequency,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  async listInterestRates(auth: AuthContext, filter: { q?: string; status?: string }) {
    const organisationId = auth.user.organisation.id;
    const where: Prisma.InterestRateWhereInput = { organisationId };
    if (filter.status) {
      const status = filter.status.trim().toUpperCase();
      if (status === 'ACTIVE' || status === 'INACTIVE') where.status = status as 'ACTIVE' | 'INACTIVE';
    }
    const query = filter.q?.trim();
    if (query) {
      where.OR = [
        { code: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }
    const rates = await this.prisma.interestRate.findMany({
      where,
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
    return {
      items: rates.map((rate) => this.serializeInterestRate(rate)),
      canView: this.can(auth, 'Settings Product : View'),
      canEdit: this.can(auth, 'Settings Product : Create'),
    };
  }

  async createInterestRate(auth: AuthContext, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const code = String(body.code ?? '').trim().toUpperCase();
    const name = String(body.name ?? '').trim();
    if (!code) throw new BadRequestException('Code is required.');
    if (!name) throw new BadRequestException('Name is required.');
    const rateBp = Number(body.rateBp ?? 0);
    if (!Number.isFinite(rateBp) || rateBp < 0) throw new BadRequestException('Rate must be a valid number.');

    const existing = await this.prisma.interestRate.findUnique({
      where: { organisationId_code: { organisationId, code } },
      select: { id: true },
    });
    if (existing) throw new ConflictException('An interest rate with that code already exists.');

    const status = String(body.status ?? 'ACTIVE').trim().toUpperCase();
    if (status !== 'ACTIVE' && status !== 'INACTIVE') throw new BadRequestException('Status must be ACTIVE or INACTIVE.');

    const rate = await this.prisma.interestRate.create({
      data: {
        organisationId,
        code,
        name,
        status: status as 'ACTIVE' | 'INACTIVE',
        rateBp: Math.round(rateBp),
        period: String(body.period ?? 'ANNUAL').trim() || 'ANNUAL',
        description: body.description ? String(body.description).trim() : null,
        effectiveFrom: body.effectiveFrom ? new Date(String(body.effectiveFrom)) : null,
      },
    });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Interest rate created',
      entityType: 'InterestRate',
      entityId: rate.id,
      before: undefined,
      after: this.serializeInterestRate(rate),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { rate: this.serializeInterestRate(rate), canEdit: this.can(auth, 'Settings Product : Create') };
  }

  private serializeInterestRate(rate: Prisma.InterestRateGetPayload<Record<string, never>>) {
    return {
      id: rate.id,
      code: rate.code,
      name: rate.name,
      status: rate.status,
      rateBp: rate.rateBp,
      period: rate.period,
      effectiveFrom: rate.effectiveFrom?.toISOString() ?? null,
      description: rate.description,
      createdAt: rate.createdAt.toISOString(),
      updatedAt: rate.updatedAt.toISOString(),
    };
  }

  private serializeLoanProduct(product: Prisma.LoanProductGetPayload<Record<string, never>>) {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      status: product.status,
      description: product.description,
      minPrincipalMinor: product.minPrincipalMinor.toString(),
      maxPrincipalMinor: product.maxPrincipalMinor.toString(),
      minTenureMonths: product.minTenureMonths,
      maxTenureMonths: product.maxTenureMonths,
      interestRateBp: product.interestRateBp,
      interestMethod: product.interestMethod,
      repaymentFrequency: product.repaymentFrequency,
      gracePeriodDays: product.gracePeriodDays,
      arrearsClassificationDays: product.arrearsClassificationDays,
      managementFeeBp: product.managementFeeBp,
      penaltyBp: product.penaltyBp,
      principalAccountId: product.principalAccountId,
      interestIncomeAccountId: product.interestIncomeAccountId,
      chargesIncomeAccountId: product.chargesIncomeAccountId,
      penaltyIncomeAccountId: product.penaltyIncomeAccountId,
      workflowStages: product.workflowStages,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  async createBranch(auth: AuthContext, body: BranchInput, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const code = normaliseBranchCode(body.code);
    const name = requiredText(body.name, 'Branch name');
    const region = requiredText(body.region, 'Region');
    const status = parseBranchStatus(body.status, 'OPEN');
    const employeeCount =
      body.employeeCount === undefined
        ? 0
        : parseInteger(body.employeeCount, 'Employees', 0, 100_000);
    const hours = parseHours(body.hours) ?? defaultBranchHours();

    if (body.isDefault !== undefined && typeof body.isDefault !== 'boolean') {
      throw new BadRequestException('Default flag must be true or false.');
    }

    const existing = await this.prisma.branch.findUnique({
      where: { organisationId_code: { organisationId, code } },
      select: { id: true },
    });
    if (existing) throw new ConflictException('A branch with that code already exists.');

    const branchCount = await this.prisma.branch.count({ where: { organisationId } });
    const makeDefault = body.isDefault === true || branchCount === 0;
    if (makeDefault && status === 'CLOSED') {
      throw new BadRequestException('The default branch must stay open.');
    }

    let created: { id: string };
    try {
      created = await this.prisma.$transaction(async (tx) => {
        if (makeDefault) {
          await tx.branch.updateMany({
            where: { organisationId, isDefault: true },
            data: { isDefault: false },
          });
        }
        const branch = await tx.branch.create({
          data: {
            organisationId,
            code,
            name,
            addressLine: optionalText(body.addressLine),
            region,
            district: optionalText(body.district),
            ward: optionalText(body.ward),
            councilType: parseCouncilType(body.councilType),
            employeeCount,
            status,
            isDefault: makeDefault,
          },
          select: { id: true },
        });
        await tx.branchHour.createMany({
          data: hours.map((hour) => ({ ...hour, branchId: branch.id })),
        });
        return branch;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('That branch code or default flag conflicts with an existing branch.');
      }
      throw error;
    }

    await this.audit.record({
      organisationId,
      branchId: created.id,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Branch created',
      entityType: 'Branch',
      entityId: created.id,
      after: {
        code,
        name,
        region,
        district: optionalText(body.district),
        ward: optionalText(body.ward),
        councilType: parseCouncilType(body.councilType),
        employeeCount,
        status,
        isDefault: makeDefault,
        hours,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return this.getBranch(auth, created.id);
  }

  async updateBranch(
    auth: AuthContext,
    id: string,
    body: BranchInput,
    context: MutationContext,
  ) {
    const organisationId = auth.user.organisation.id;
    const branch = await this.prisma.branch.findFirst({
      where: { id, organisationId },
      include: BRANCH_INCLUDE,
    });
    if (!branch) throw new NotFoundException('Branch not found.');

    const updates: Prisma.BranchUpdateInput = {};
    if (body.code !== undefined) updates.code = normaliseBranchCode(body.code);
    if (body.name !== undefined) updates.name = requiredText(body.name, 'Branch name');
    if (body.addressLine !== undefined) updates.addressLine = optionalText(body.addressLine);
    if (body.region !== undefined) updates.region = requiredText(body.region, 'Region');
    if (body.district !== undefined) updates.district = optionalText(body.district);
    if (body.ward !== undefined) updates.ward = optionalText(body.ward);
    if (body.councilType !== undefined) updates.councilType = parseCouncilType(body.councilType);
    if (body.employeeCount !== undefined) {
      updates.employeeCount = parseInteger(body.employeeCount, 'Employees', 0, 100_000);
    }

    const nextStatus = body.status !== undefined ? parseBranchStatus(body.status) : branch.status;
    updates.status = nextStatus;

    if (body.isDefault !== undefined && typeof body.isDefault !== 'boolean') {
      throw new BadRequestException('Default flag must be true or false.');
    }
    const nextDefault = body.isDefault !== undefined ? body.isDefault === true : branch.isDefault;
    if (branch.isDefault && !nextDefault) {
      throw new BadRequestException('Promote another branch before removing the default flag.');
    }
    if (nextDefault && nextStatus === 'CLOSED') {
      throw new BadRequestException('The default branch must stay open.');
    }

    const hours = parseHours(body.hours);

    try {
      await this.prisma.$transaction(async (tx) => {
        if (nextDefault && !branch.isDefault) {
          await tx.branch.updateMany({
            where: { organisationId, isDefault: true },
            data: { isDefault: false },
          });
        }
        await tx.branch.update({
          where: { id },
          data: { ...updates, isDefault: nextDefault },
        });
        if (hours) {
          await tx.branchHour.deleteMany({ where: { branchId: id } });
          await tx.branchHour.createMany({
            data: hours.map((hour) => ({ ...hour, branchId: id })),
          });
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('That branch code or default flag conflicts with an existing branch.');
      }
      throw error;
    }

    await this.audit.record({
      organisationId,
      branchId: id,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Branch updated',
      entityType: 'Branch',
      entityId: id,
      before: this.branchAudit(branch),
      after: {
        code: body.code !== undefined ? normaliseBranchCode(body.code) : branch.code,
        name: body.name !== undefined ? requiredText(body.name, 'Branch name') : branch.name,
        region: body.region !== undefined ? requiredText(body.region, 'Region') : branch.region,
        status: nextStatus,
        isDefault: nextDefault,
        employeeCount:
          body.employeeCount !== undefined
            ? parseInteger(body.employeeCount, 'Employees', 0, 100_000)
            : branch.employeeCount,
        hours: hours ?? branch.hours,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return this.getBranch(auth, id);
  }

  private serializeBranch(branch: BranchRecord) {
    return {
      id: branch.id,
      code: branch.code,
      name: branch.name,
      addressLine: branch.addressLine,
      region: branch.region,
      district: branch.district,
      ward: branch.ward,
      councilType: branch.councilType,
      employeeCount: branch.employeeCount,
      status: branch.status,
      isDefault: branch.isDefault,
      userCount: branch._count.users,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
      hours: branch.hours.map((hour) => ({
        weekday: hour.weekday,
        isClosed: hour.isClosed,
        opensMinute: hour.opensMinute,
        closesMinute: hour.closesMinute,
      })),
    };
  }

  private organisationAudit(
    organisation: Prisma.OrganisationGetPayload<{ select: typeof ORGANISATION_SELECT }> | null,
  ): Prisma.InputJsonValue {
    if (!organisation) return {};
    return {
      name: organisation.name,
      registrationNo: organisation.registrationNo,
      dialect: organisation.dialect,
      timezone: organisation.timezone,
      logoUrl: resolveLogoUrl(organisation.logoUrl, organisation.logoUpdatedAt),
      defaultBranchId:
        organisation.branches.find((branch) => branch.isDefault)?.id ?? null,
    };
  }

  private branchAudit(branch: BranchRecord) {
    return {
      code: branch.code,
      name: branch.name,
      region: branch.region,
      district: branch.district,
      ward: branch.ward,
      councilType: branch.councilType,
      employeeCount: branch.employeeCount,
      status: branch.status,
      isDefault: branch.isDefault,
      hours: branch.hours.map((hour) => ({
        weekday: hour.weekday,
        isClosed: hour.isClosed,
        opensMinute: hour.opensMinute,
        closesMinute: hour.closesMinute,
      })),
    };
  }

  private can(auth: AuthContext, permission: string): boolean {
    return auth.user.permissions.includes(permission);
  }
}
