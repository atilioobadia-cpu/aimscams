import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type PrismaClient } from '@aimscams/db';
import { generateSchedule, money, rate } from '@aimscams/domain';

import { AuditService } from '../auth/audit.service.js';
import type { AuthContext } from '../auth/auth.types.js';
import { PRISMA } from '../prisma/prisma.module.js';
import {
  parseEconomicSector,
  parseInterestMethod,
  parseIsoDate,
  parseLoanDocuments,
  parseOptionalMinor,
  parsePaymentDestination,
  parseTenurePeriod,
  tenureInMonths,
} from './loan-applications.logic.js';
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

const LOAN_APPLICATION_INCLUDE = {
  client: { select: { fullName: true, referenceNo: true } },
  product: { select: { name: true, code: true } },
  loanOfficer: { select: { fullName: true } },
  documents: {
    select: {
      id: true,
      kind: true,
      name: true,
      contentType: true,
      sizeBytes: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.LoanApplicationInclude;

const LOAN_INCLUDE = {
  client: { select: { fullName: true, referenceNo: true } },
  product: { select: { name: true, code: true } },
  application: { select: { applicationNo: true } },
} satisfies Prisma.LoanInclude;

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

  async updateInterestRate(auth: AuthContext, id: string, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const before = await this.prisma.interestRate.findFirst({ where: { id, organisationId } });
    if (!before) throw new NotFoundException('Interest rate not found.');

    const data: Prisma.InterestRateUpdateInput = {};
    if (body.status !== undefined) {
      const status = String(body.status).trim().toUpperCase();
      if (status !== 'ACTIVE' && status !== 'INACTIVE') throw new BadRequestException('Status must be ACTIVE or INACTIVE.');
      data.status = status as 'ACTIVE' | 'INACTIVE';
    }
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) throw new BadRequestException('Name is required.');
      data.name = name;
    }

    const updated = await this.prisma.interestRate.update({ where: { id }, data });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Interest rate updated',
      entityType: 'InterestRate',
      entityId: id,
      before: this.serializeInterestRate(before),
      after: this.serializeInterestRate(updated),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { rate: this.serializeInterestRate(updated), canEdit: this.can(auth, 'Settings Product : Edit') };
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

  async listFeePenalties(auth: AuthContext, filter: { q?: string; status?: string; kind?: string }) {
    const organisationId = auth.user.organisation.id;
    const where: Prisma.FeePenaltyWhereInput = { organisationId };
    if (filter.status) {
      const status = filter.status.trim().toUpperCase();
      if (status === 'ACTIVE' || status === 'INACTIVE') where.status = status as 'ACTIVE' | 'INACTIVE';
    }
    if (filter.kind) {
      const kind = filter.kind.trim().toUpperCase();
      if (kind === 'FEE' || kind === 'PENALTY') where.kind = kind as 'FEE' | 'PENALTY';
    }
    const query = filter.q?.trim();
    if (query) {
      where.OR = [
        { code: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }
    const items = await this.prisma.feePenalty.findMany({
      where,
      orderBy: [{ kind: 'asc' }, { name: 'asc' }],
    });
    return {
      items: items.map((item) => this.serializeFeePenalty(item)),
      canView: this.can(auth, 'Settings Product : View'),
      canEdit: this.can(auth, 'Settings Product : Edit'),
    };
  }

  async createFeePenalty(auth: AuthContext, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const code = String(body.code ?? '').trim().toUpperCase();
    const name = String(body.name ?? '').trim();
    if (!code) throw new BadRequestException('Code is required.');
    if (!name) throw new BadRequestException('Name is required.');
    const kind = String(body.kind ?? '').trim().toUpperCase();
    if (kind !== 'FEE' && kind !== 'PENALTY') throw new BadRequestException('Kind must be FEE or PENALTY.');
    const amountType = String(body.amountType ?? '').trim().toUpperCase();
    if (amountType !== 'FIXED' && amountType !== 'PERCENTAGE') throw new BadRequestException('Amount type must be FIXED or PERCENTAGE.');

    const existing = await this.prisma.feePenalty.findUnique({
      where: { organisationId_code: { organisationId, code } },
      select: { id: true },
    });
    if (existing) throw new ConflictException('A fee or penalty with that code already exists.');

    const item = await this.prisma.feePenalty.create({
      data: {
        organisationId,
        code,
        name,
        kind: kind as 'FEE' | 'PENALTY',
        amountType: amountType as 'FIXED' | 'PERCENTAGE',
        amountMinor: body.amountMinor ? BigInt(String(body.amountMinor)) : null,
        rateBp: body.rateBp !== undefined && body.rateBp !== null ? Number(body.rateBp) : null,
        glAccountId: body.glAccountId ? String(body.glAccountId).trim() : null,
        status: 'ACTIVE',
        description: body.description ? String(body.description).trim() : null,
      },
    });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Fee or penalty created',
      entityType: 'FeePenalty',
      entityId: item.id,
      before: undefined,
      after: this.serializeFeePenalty(item),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { item: this.serializeFeePenalty(item), canEdit: this.can(auth, 'Settings Product : Edit') };
  }

  async updateFeePenalty(auth: AuthContext, id: string, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const before = await this.prisma.feePenalty.findFirst({ where: { id, organisationId } });
    if (!before) throw new NotFoundException('Fee or penalty not found.');

    const data: Prisma.FeePenaltyUpdateInput = {};
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
    if (body.kind !== undefined) {
      const kind = String(body.kind).trim().toUpperCase();
      if (kind !== 'FEE' && kind !== 'PENALTY') throw new BadRequestException('Kind must be FEE or PENALTY.');
      data.kind = kind as 'FEE' | 'PENALTY';
    }
    if (body.amountType !== undefined) {
      const amountType = String(body.amountType).trim().toUpperCase();
      if (amountType !== 'FIXED' && amountType !== 'PERCENTAGE') throw new BadRequestException('Amount type must be FIXED or PERCENTAGE.');
      data.amountType = amountType as 'FIXED' | 'PERCENTAGE';
    }
    if (body.amountMinor !== undefined) data.amountMinor = body.amountMinor ? BigInt(String(body.amountMinor)) : null;
    if (body.rateBp !== undefined) data.rateBp = body.rateBp !== null ? Number(body.rateBp) : null;
    if (body.glAccountId !== undefined) data.glAccountId = body.glAccountId ? String(body.glAccountId).trim() : null;
    if (body.status !== undefined) {
      const status = String(body.status).trim().toUpperCase();
      if (status !== 'ACTIVE' && status !== 'INACTIVE') throw new BadRequestException('Status must be ACTIVE or INACTIVE.');
      data.status = status as 'ACTIVE' | 'INACTIVE';
    }
    if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;

    const updated = await this.prisma.feePenalty.update({ where: { id }, data });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Fee or penalty updated',
      entityType: 'FeePenalty',
      entityId: id,
      before: this.serializeFeePenalty(before),
      after: this.serializeFeePenalty(updated),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { item: this.serializeFeePenalty(updated), canEdit: this.can(auth, 'Settings Product : Edit') };
  }

  private serializeFeePenalty(item: Prisma.FeePenaltyGetPayload<Record<string, never>>) {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      kind: item.kind,
      amountType: item.amountType,
      amountMinor: item.amountMinor?.toString() ?? null,
      rateBp: item.rateBp,
      glAccountId: item.glAccountId,
      status: item.status,
      description: item.description,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async listProvisioningRules(auth: AuthContext, filter: { q?: string; status?: string }) {
    const organisationId = auth.user.organisation.id;
    const where: Prisma.ProvisioningRuleWhereInput = { organisationId };
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
    const items = await this.prisma.provisioningRule.findMany({
      where,
      orderBy: [{ daysFrom: 'asc' }],
    });
    return {
      items: items.map((item) => this.serializeProvisioningRule(item)),
      canView: this.can(auth, 'Settings Product : View'),
      canEdit: this.can(auth, 'Settings Product : Create'),
    };
  }

  async createProvisioningRule(auth: AuthContext, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const code = String(body.code ?? '').trim().toUpperCase();
    const name = String(body.name ?? '').trim();
    if (!code) throw new BadRequestException('Code is required.');
    if (!name) throw new BadRequestException('Name is required.');
    const daysFrom = Number(body.daysFrom ?? 0);
    const daysTo = body.daysTo === null || body.daysTo === undefined || body.daysTo === '' ? null : Number(body.daysTo);
    const rateBp = Number(body.rateBp ?? 0);
    if (!Number.isFinite(daysFrom) || daysFrom < 0) throw new BadRequestException('Days from must be a valid number.');
    if (daysTo !== null && (!Number.isFinite(daysTo) || daysTo < daysFrom)) throw new BadRequestException('Days to must be greater than or equal to days from.');
    if (!Number.isFinite(rateBp) || rateBp < 0) throw new BadRequestException('Rate must be a valid number.');

    const existing = await this.prisma.provisioningRule.findUnique({
      where: { organisationId_code: { organisationId, code } },
      select: { id: true },
    });
    if (existing) throw new ConflictException('A provisioning rule with that code already exists.');

    const status = String(body.status ?? 'ACTIVE').trim().toUpperCase();
    if (status !== 'ACTIVE' && status !== 'INACTIVE') throw new BadRequestException('Status must be ACTIVE or INACTIVE.');

    const item = await this.prisma.provisioningRule.create({
      data: {
        organisationId,
        code,
        name,
        status: status as 'ACTIVE' | 'INACTIVE',
        daysFrom,
        daysTo,
        rateBp: Math.round(rateBp),
        glAccountId: body.glAccountId ? String(body.glAccountId).trim() : null,
        description: body.description ? String(body.description).trim() : null,
      },
    });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Provisioning rule created',
      entityType: 'ProvisioningRule',
      entityId: item.id,
      before: undefined,
      after: this.serializeProvisioningRule(item),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { item: this.serializeProvisioningRule(item), canEdit: this.can(auth, 'Settings Product : Create') };
  }

  async updateProvisioningRule(auth: AuthContext, id: string, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const before = await this.prisma.provisioningRule.findFirst({ where: { id, organisationId } });
    if (!before) throw new NotFoundException('Provisioning rule not found.');

    const data: Prisma.ProvisioningRuleUpdateInput = {};
    if (body.status !== undefined) {
      const status = String(body.status).trim().toUpperCase();
      if (status !== 'ACTIVE' && status !== 'INACTIVE') throw new BadRequestException('Status must be ACTIVE or INACTIVE.');
      data.status = status as 'ACTIVE' | 'INACTIVE';
    }
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) throw new BadRequestException('Name is required.');
      data.name = name;
    }

    const updated = await this.prisma.provisioningRule.update({ where: { id }, data });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Provisioning rule updated',
      entityType: 'ProvisioningRule',
      entityId: id,
      before: this.serializeProvisioningRule(before),
      after: this.serializeProvisioningRule(updated),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { item: this.serializeProvisioningRule(updated), canEdit: this.can(auth, 'Settings Product : Edit') };
  }

  private serializeProvisioningRule(item: Prisma.ProvisioningRuleGetPayload<Record<string, never>>) {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      status: item.status,
      daysFrom: item.daysFrom,
      daysTo: item.daysTo,
      rateBp: item.rateBp,
      glAccountId: item.glAccountId,
      description: item.description,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async listMembershipPolicies(auth: AuthContext, filter: { q?: string; status?: string }) {
    const organisationId = auth.user.organisation.id;
    const where: Prisma.MembershipPolicyWhereInput = { organisationId };
    if (filter.status) {
      const status = filter.status.trim().toUpperCase();
      if (status === 'DRAFT' || status === 'ACTIVE' || status === 'INACTIVE') where.status = status as 'DRAFT' | 'ACTIVE' | 'INACTIVE';
    }
    const query = filter.q?.trim();
    if (query) {
      where.OR = [
        { code: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }
    const items = await this.prisma.membershipPolicy.findMany({
      where,
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
    return {
      items: items.map((item) => this.serializeMembershipPolicy(item)),
      canView: this.can(auth, 'Settings Policy : View'),
      canEdit: this.can(auth, 'Settings Policy : Create'),
    };
  }

  async createMembershipPolicy(auth: AuthContext, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const code = String(body.code ?? '').trim().toUpperCase();
    const name = String(body.name ?? '').trim();
    if (!code) throw new BadRequestException('Code is required.');
    if (!name) throw new BadRequestException('Name is required.');

    const existing = await this.prisma.membershipPolicy.findUnique({
      where: { organisationId_code: { organisationId, code } },
      select: { id: true },
    });
    if (existing) throw new ConflictException('A membership policy with that code already exists.');

    const status = String(body.status ?? 'DRAFT').trim().toUpperCase();
    if (status !== 'DRAFT' && status !== 'ACTIVE' && status !== 'INACTIVE') throw new BadRequestException('Status must be DRAFT, ACTIVE or INACTIVE.');

    const item = await this.prisma.membershipPolicy.create({
      data: {
        organisationId,
        code,
        name,
        status: status as 'DRAFT' | 'ACTIVE' | 'INACTIVE',
        description: body.description ? String(body.description).trim() : null,
        memberType: String(body.memberType ?? 'INDIVIDUAL').trim() || 'INDIVIDUAL',
        minNextOfKin: Number(body.minNextOfKin ?? 1),
        maxNextOfKin: Number(body.maxNextOfKin ?? 2),
        dormantDays: Number(body.dormantDays ?? 365),
        allowWithdraw: body.allowWithdraw !== false,
        autoActiveUponDeposit: body.autoActiveUponDeposit === true,
        enableMemberVerification: body.enableMemberVerification === true,
        verificationType: body.verificationType ? String(body.verificationType).trim() : null,
        boardApproval: body.boardApproval ?? undefined,
      },
    });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Membership policy created',
      entityType: 'MembershipPolicy',
      entityId: item.id,
      before: undefined,
      after: this.serializeMembershipPolicy(item),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { item: this.serializeMembershipPolicy(item), canEdit: this.can(auth, 'Settings Policy : Create') };
  }

  async listCreditProductPolicies(auth: AuthContext, filter: { q?: string; status?: string }) {
    const organisationId = auth.user.organisation.id;
    const where: Prisma.CreditProductPolicyWhereInput = { organisationId };
    if (filter.status) {
      const status = filter.status.trim().toUpperCase();
      if (status === 'DRAFT' || status === 'ACTIVE' || status === 'INACTIVE') where.status = status as 'DRAFT' | 'ACTIVE' | 'INACTIVE';
    }
    const query = filter.q?.trim();
    if (query) {
      where.OR = [
        { code: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }
    const items = await this.prisma.creditProductPolicy.findMany({
      where,
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
    return {
      items: items.map((item) => this.serializeCreditProductPolicy(item)),
      canView: this.can(auth, 'Settings Policy : View'),
      canEdit: this.can(auth, 'Settings Policy : Create'),
    };
  }

  async createCreditProductPolicy(auth: AuthContext, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const code = String(body.code ?? '').trim().toUpperCase();
    const name = String(body.name ?? '').trim();
    if (!code) throw new BadRequestException('Code is required.');
    if (!name) throw new BadRequestException('Name is required.');

    const existing = await this.prisma.creditProductPolicy.findUnique({
      where: { organisationId_code: { organisationId, code } },
      select: { id: true },
    });
    if (existing) throw new ConflictException('A credit product policy with that code already exists.');

    const status = String(body.status ?? 'DRAFT').trim().toUpperCase();
    if (status !== 'DRAFT' && status !== 'ACTIVE' && status !== 'INACTIVE') throw new BadRequestException('Status must be DRAFT, ACTIVE or INACTIVE.');

    const item = await this.prisma.creditProductPolicy.create({
      data: {
        organisationId,
        code,
        name,
        status: status as 'DRAFT' | 'ACTIVE' | 'INACTIVE',
        description: body.description ? String(body.description).trim() : null,
        content: body.content ?? undefined,
      },
    });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Credit product policy created',
      entityType: 'CreditProductPolicy',
      entityId: item.id,
      before: undefined,
      after: this.serializeCreditProductPolicy(item),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { item: this.serializeCreditProductPolicy(item), canEdit: this.can(auth, 'Settings Policy : Create') };
  }

  async getCreditProductPolicy(auth: AuthContext, id: string) {
    const item = await this.prisma.creditProductPolicy.findFirst({
      where: { id, organisationId: auth.user.organisation.id },
    });
    if (!item) throw new NotFoundException('Credit product policy not found.');
    return {
      item: this.serializeCreditProductPolicy(item),
      canEdit: this.can(auth, 'Settings Policy : Edit'),
    };
  }

  async updateCreditProductPolicy(auth: AuthContext, id: string, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const before = await this.prisma.creditProductPolicy.findFirst({ where: { id, organisationId } });
    if (!before) throw new NotFoundException('Credit product policy not found.');

    const data: Prisma.CreditProductPolicyUpdateInput = {};
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
      if (status !== 'DRAFT' && status !== 'ACTIVE' && status !== 'INACTIVE') throw new BadRequestException('Status must be DRAFT, ACTIVE or INACTIVE.');
      data.status = status as 'DRAFT' | 'ACTIVE' | 'INACTIVE';
    }
    if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
    if (body.content !== undefined) data.content = body.content ?? undefined;

    const updated = await this.prisma.creditProductPolicy.update({ where: { id }, data });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Credit product policy updated',
      entityType: 'CreditProductPolicy',
      entityId: id,
      before: this.serializeCreditProductPolicy(before),
      after: this.serializeCreditProductPolicy(updated),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { item: this.serializeCreditProductPolicy(updated), canEdit: this.can(auth, 'Settings Policy : Edit') };
  }

  private serializeCreditProductPolicy(item: Prisma.CreditProductPolicyGetPayload<Record<string, never>>) {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      status: item.status,
      description: item.description,
      content: item.content,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async getMembershipPolicy(auth: AuthContext, id: string) {
    const item = await this.prisma.membershipPolicy.findFirst({
      where: { id, organisationId: auth.user.organisation.id },
    });
    if (!item) throw new NotFoundException('Membership policy not found.');
    return {
      item: this.serializeMembershipPolicy(item),
      canEdit: this.can(auth, 'Settings Policy : Edit'),
    };
  }

  async updateMembershipPolicy(auth: AuthContext, id: string, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const before = await this.prisma.membershipPolicy.findFirst({
      where: { id, organisationId },
    });
    if (!before) throw new NotFoundException('Membership policy not found.');

    const data: Prisma.MembershipPolicyUpdateInput = {};
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
      if (status !== 'DRAFT' && status !== 'ACTIVE' && status !== 'INACTIVE') throw new BadRequestException('Status must be DRAFT, ACTIVE or INACTIVE.');
      data.status = status as 'DRAFT' | 'ACTIVE' | 'INACTIVE';
    }
    if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
    if (body.memberType !== undefined) data.memberType = String(body.memberType).trim() || 'INDIVIDUAL';
    if (body.minNextOfKin !== undefined) data.minNextOfKin = Number(body.minNextOfKin);
    if (body.maxNextOfKin !== undefined) data.maxNextOfKin = Number(body.maxNextOfKin);
    if (body.dormantDays !== undefined) data.dormantDays = Number(body.dormantDays);
    if (body.allowWithdraw !== undefined) data.allowWithdraw = body.allowWithdraw === true;
    if (body.autoActiveUponDeposit !== undefined) data.autoActiveUponDeposit = body.autoActiveUponDeposit === true;
    if (body.enableMemberVerification !== undefined) data.enableMemberVerification = body.enableMemberVerification === true;
    if (body.verificationType !== undefined) data.verificationType = body.verificationType ? String(body.verificationType).trim() : null;

    const updated = await this.prisma.membershipPolicy.update({ where: { id }, data });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Membership policy updated',
      entityType: 'MembershipPolicy',
      entityId: id,
      before: this.serializeMembershipPolicy(before),
      after: this.serializeMembershipPolicy(updated),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { item: this.serializeMembershipPolicy(updated), canEdit: this.can(auth, 'Settings Policy : Edit') };
  }

  private serializeMembershipPolicy(item: Prisma.MembershipPolicyGetPayload<Record<string, never>>) {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      status: item.status,
      description: item.description,
      memberType: item.memberType,
      minNextOfKin: item.minNextOfKin,
      maxNextOfKin: item.maxNextOfKin,
      dormantDays: item.dormantDays,
      allowWithdraw: item.allowWithdraw,
      autoActiveUponDeposit: item.autoActiveUponDeposit,
      enableMemberVerification: item.enableMemberVerification,
      verificationType: item.verificationType,
      boardApproval: item.boardApproval,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async listHolidays(auth: AuthContext) {
    const organisationId = auth.user.organisation.id;
    const items = await this.prisma.holiday.findMany({
      where: { organisationId },
      orderBy: { holidayDate: 'asc' },
    });
    return {
      items: items.map((item) => this.serializeHoliday(item)),
      canView: this.can(auth, 'Settings Policy : View'),
      canEdit: this.can(auth, 'Settings Policy : Create'),
    };
  }

  async createHoliday(auth: AuthContext, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const name = String(body.name ?? '').trim();
    if (!name) throw new BadRequestException('Name is required.');
    if (!body.holidayDate) throw new BadRequestException('Holiday date is required.');
    const date = new Date(String(body.holidayDate));
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Holiday date must be valid.');

    const item = await this.prisma.holiday.create({
      data: {
        organisationId,
        name,
        holidayDate: date,
        branchId: body.branchId ? String(body.branchId) : null,
      },
    });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Holiday created',
      entityType: 'Holiday',
      entityId: item.id,
      before: undefined,
      after: this.serializeHoliday(item),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { item: this.serializeHoliday(item), canEdit: this.can(auth, 'Settings Policy : Create') };
  }

  private serializeHoliday(item: Prisma.HolidayGetPayload<Record<string, never>>) {
    return {
      id: item.id,
      name: item.name,
      holidayDate: item.holidayDate.toISOString().slice(0, 10),
      branchId: item.branchId,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async updateLoanProduct(auth: AuthContext, id: string, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const before = await this.prisma.loanProduct.findFirst({ where: { id, organisationId } });
    if (!before) throw new NotFoundException('Loan product not found.');

    const data: Prisma.LoanProductUpdateInput = {};
    if (body.status !== undefined) {
      const status = String(body.status).trim().toUpperCase();
      if (status !== 'DRAFT' && status !== 'ACTIVE' && status !== 'INACTIVE') {
        throw new BadRequestException('Status must be DRAFT, ACTIVE or INACTIVE.');
      }
      data.status = status as 'DRAFT' | 'ACTIVE' | 'INACTIVE';
    }
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) throw new BadRequestException('Name is required.');
      data.name = name;
    }

    const updated = await this.prisma.loanProduct.update({ where: { id }, data });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Loan product updated',
      entityType: 'LoanProduct',
      entityId: id,
      before: this.serializeLoanProduct(before),
      after: this.serializeLoanProduct(updated),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { product: this.serializeLoanProduct(updated), canEdit: this.can(auth, 'Settings Product : Edit') };
  }

  async listClients(auth: AuthContext, filter: { q?: string; status?: string; clientType?: string }) {
    const organisationId = auth.user.organisation.id;
    const where: Prisma.ClientWhereInput = { organisationId };
    if (filter.status) {
      const status = filter.status.trim().toUpperCase();
      if (status === 'ACTIVE' || status === 'INACTIVE' || status === 'PENDING') where.status = status as 'ACTIVE' | 'INACTIVE' | 'PENDING';
    }
    if (filter.clientType) {
      const type = filter.clientType.trim().toUpperCase();
      if (type === 'INDIVIDUAL' || type === 'GROUP') where.clientType = type as 'INDIVIDUAL' | 'GROUP';
    }
    const query = filter.q?.trim();
    if (query) {
      where.OR = [
        { referenceNo: { contains: query, mode: 'insensitive' } },
        { fullName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { nationalId: { contains: query, mode: 'insensitive' } },
      ];
    }
    const items = await this.prisma.client.findMany({
      where,
      include: { group: { select: { fullName: true } } },
      orderBy: [{ status: 'asc' }, { fullName: 'asc' }],
    });
    return {
      items: items.map((item) => this.serializeClient(item)),
      canView: this.can(auth, 'Client : View'),
      canCreate: this.can(auth, 'Client : Create'),
      canEdit: this.can(auth, 'Client : Edit'),
    };
  }

  async createClient(auth: AuthContext, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    let referenceNo = String(body.referenceNo ?? '').trim().toUpperCase();
    if (!referenceNo) {
      const existing = await this.prisma.client.findMany({
        where: { organisationId },
        select: { referenceNo: true },
      });
      const max = existing.reduce((current, item) => {
        const value = Number.parseInt(item.referenceNo, 10);
        return Number.isFinite(value) && value > current ? value : current;
      }, 0);
      referenceNo = String(max + 1).padStart(6, '0');
    }
    const fullName = String(body.fullName ?? '').trim();
    if (!referenceNo) throw new BadRequestException('Reference number is required.');
    if (!fullName) throw new BadRequestException('Full name is required.');

    const existing = await this.prisma.client.findUnique({
      where: { organisationId_referenceNo: { organisationId, referenceNo } },
      select: { id: true },
    });
    if (existing) throw new ConflictException('A client with that reference number already exists.');

    let memberNo = String(body.memberNo ?? '').trim();
    if (!memberNo) {
      const existingMembers = await this.prisma.client.findMany({
        where: { organisationId },
        select: { memberNo: true },
      });
      const maxMember = existingMembers.reduce((current, item) => {
        const value = Number.parseInt(item.memberNo ?? '', 10);
        return Number.isFinite(value) && value > current ? value : current;
      }, 0);
      memberNo = String(maxMember + 1).padStart(10, '0');
    }

    const item = await this.prisma.client.create({
      data: {
        organisationId,
        branchId: body.branchId ? String(body.branchId) : null,
        membershipPolicyId: body.membershipPolicyId ? String(body.membershipPolicyId) : null,
        groupId: body.groupId ? String(body.groupId) : null,
        memberNo,
        referenceNo,
        fullName,
        clientType: String(body.clientType ?? 'INDIVIDUAL').trim().toUpperCase() === 'GROUP' ? 'GROUP' : 'INDIVIDUAL',
        phone: body.phone ? String(body.phone).trim() : null,
        email: body.email ? String(body.email).trim() : null,
        nationalId: body.nationalId ? String(body.nationalId).trim() : null,
        status: 'ACTIVE',
        kycStatus: 'PENDING',
        joinedAt: body.joinedAt ? new Date(String(body.joinedAt)) : new Date(),
        profile: body.profile ?? undefined,
      },
    });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Client created',
      entityType: 'Client',
      entityId: item.id,
      before: undefined,
      after: this.serializeClient(item),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { client: this.serializeClient(item), canEdit: this.can(auth, 'Client : Edit') };
  }

  async updateClient(auth: AuthContext, id: string, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const before = await this.prisma.client.findFirst({ where: { id, organisationId } });
    if (!before) throw new NotFoundException('Client not found.');

    const data: Prisma.ClientUpdateInput = {};
    if (body.status !== undefined) {
      const status = String(body.status).trim().toUpperCase();
      if (status !== 'ACTIVE' && status !== 'INACTIVE' && status !== 'PENDING') {
        throw new BadRequestException('Status must be ACTIVE, INACTIVE or PENDING.');
      }
      data.status = status as 'ACTIVE' | 'INACTIVE' | 'PENDING';
    }

    const updated = await this.prisma.client.update({ where: { id }, data });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Client updated',
      entityType: 'Client',
      entityId: id,
      before: this.serializeClient(before),
      after: this.serializeClient(updated),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { client: this.serializeClient(updated), canEdit: this.can(auth, 'Client : Edit') };
  }

  async getClient(auth: AuthContext, id: string) {
    const item = await this.prisma.client.findFirst({
      where: { id, organisationId: auth.user.organisation.id },
      include: { group: { select: { fullName: true } }, branch: { select: { name: true, code: true } } },
    });
    if (!item) throw new NotFoundException('Client not found.');
    return {
      client: this.serializeClient(item),
      canEdit: this.can(auth, 'Client : Edit'),
    };
  }

  private serializeClient(item: any) {
    return {
      id: item.id,
      memberNo: item.memberNo,
      referenceNo: item.referenceNo,
      fullName: item.fullName,
      clientType: item.clientType,
      phone: item.phone,
      email: item.email,
      nationalId: item.nationalId,
      status: item.status,
      kycStatus: item.kycStatus,
      joinedAt: item.joinedAt?.toISOString() ?? null,
      groupName: item.group?.fullName ?? item.groupName ?? null,
      branchName: item.branch?.name ?? item.branchName ?? null,
      profile: item.profile ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async listSavingsAccounts(auth: AuthContext, filter: { q?: string; status?: string }) {
    const organisationId = auth.user.organisation.id;
    const where: Prisma.SavingsAccountWhereInput = { organisationId };
    if (filter.status) {
      const status = filter.status.trim().toUpperCase();
      if (status === 'ACTIVE' || status === 'INACTIVE' || status === 'CLOSED') where.status = status as 'ACTIVE' | 'INACTIVE' | 'CLOSED';
    }
    const query = filter.q?.trim();
    if (query) {
      where.OR = [
        { accountNumber: { contains: query, mode: 'insensitive' } },
        { client: { fullName: { contains: query, mode: 'insensitive' } } },
      ];
    }
    const items = await this.prisma.savingsAccount.findMany({
      where,
      include: { client: { select: { fullName: true, referenceNo: true } }, product: { select: { name: true, code: true } } },
      orderBy: [{ createdAt: 'desc' }],
    });
    return {
      items: items.map((item) => this.serializeSavingsAccount(item)),
      canView: this.can(auth, 'Savings Account : View'),
      canCreate: this.can(auth, 'Savings Account : Create'),
      canEdit: this.can(auth, 'Savings Account : Edit'),
    };
  }

  async createSavingsAccount(auth: AuthContext, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const clientId = String(body.clientId ?? '').trim();
    if (!clientId) throw new BadRequestException('Client is required.');

    const client = await this.prisma.client.findFirst({ where: { id: clientId, organisationId } });
    if (!client) throw new NotFoundException('Client not found.');

    const accountNumber = String(body.accountNumber ?? '').trim() || `SA-${Date.now()}`;
    const existing = await this.prisma.savingsAccount.findUnique({
      where: { organisationId_accountNumber: { organisationId, accountNumber } },
      select: { id: true },
    });
    if (existing) throw new ConflictException('A savings account with that number already exists.');

    const item = await this.prisma.savingsAccount.create({
      data: {
        organisationId,
        branchId: body.branchId ? String(body.branchId) : client.branchId,
        clientId,
        productId: body.productId ? String(body.productId) : null,
        accountNumber,
        accountType: String(body.accountType ?? 'PRIMARY').trim() || 'PRIMARY',
        status: 'ACTIVE',
      },
      include: { client: { select: { fullName: true, referenceNo: true } }, product: { select: { name: true, code: true } } },
    });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Savings account created',
      entityType: 'SavingsAccount',
      entityId: item.id,
      before: undefined,
      after: this.serializeSavingsAccount(item),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { account: this.serializeSavingsAccount(item), canEdit: this.can(auth, 'Savings Account : Edit') };
  }

  async updateSavingsAccount(auth: AuthContext, id: string, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const before = await this.prisma.savingsAccount.findFirst({ where: { id, organisationId } });
    if (!before) throw new NotFoundException('Savings account not found.');

    const data: Prisma.SavingsAccountUpdateInput = {};
    if (body.status !== undefined) {
      const status = String(body.status).trim().toUpperCase();
      if (status !== 'ACTIVE' && status !== 'INACTIVE' && status !== 'CLOSED') {
        throw new BadRequestException('Status must be ACTIVE, INACTIVE or CLOSED.');
      }
      data.status = status as 'ACTIVE' | 'INACTIVE' | 'CLOSED';
    }

    const updated = await this.prisma.savingsAccount.update({ where: { id }, data });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Savings account updated',
      entityType: 'SavingsAccount',
      entityId: id,
      before: this.serializeSavingsAccount(before),
      after: this.serializeSavingsAccount(updated),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { account: this.serializeSavingsAccount(updated), canEdit: this.can(auth, 'Savings Account : Edit') };
  }

  private serializeSavingsAccount(item: any) {
    return {
      id: item.id,
      accountNumber: item.accountNumber,
      accountType: item.accountType,
      status: item.status,
      balanceMinor: item.balanceMinor.toString(),
      clientName: item.client?.fullName ?? null,
      clientReference: item.client?.referenceNo ?? null,
      productName: item.product?.name ?? null,
      productCode: item.product?.code ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async listLoanApplications(auth: AuthContext, filter: { q?: string; status?: string }) {
    const organisationId = auth.user.organisation.id;
    const where: Prisma.LoanApplicationWhereInput = { organisationId };
    if (filter.status) {
      const status = filter.status.trim().toUpperCase();
      if (
        status === 'DRAFT' ||
        status === 'SUBMITTED' ||
        status === 'APPROVED' ||
        status === 'REJECTED' ||
        status === 'CANCELLED'
      ) {
        where.status = status as 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
      }
    }
    const query = filter.q?.trim();
    if (query) {
      where.OR = [
        { applicationNo: { contains: query, mode: 'insensitive' } },
        { client: { fullName: { contains: query, mode: 'insensitive' } } },
        { product: { name: { contains: query, mode: 'insensitive' } } },
        { product: { code: { contains: query, mode: 'insensitive' } } },
      ];
    }
    const items = await this.prisma.loanApplication.findMany({
      where,
      include: LOAN_APPLICATION_INCLUDE,
      orderBy: [{ createdAt: 'desc' }],
    });
    return {
      items: items.map((item) => this.serializeLoanApplication(item)),
      canView: this.can(auth, 'Loan Account : View'),
      canCreate: this.can(auth, 'Loan Account : Create'),
      canEdit: this.can(auth, 'Loan Account : Edit'),
    };
  }

  async createLoanApplication(auth: AuthContext, body: Record<string, unknown>, context: MutationContext) {
    const organisationId = auth.user.organisation.id;
    const clientId = String(body.clientId ?? '').trim();
    if (!clientId) throw new BadRequestException('Client is required.');

    const client = await this.prisma.client.findFirst({ where: { id: clientId, organisationId } });
    if (!client) throw new NotFoundException('Client not found.');

    let applicationNo = String(body.applicationNo ?? '').trim();
    if (!applicationNo) {
      const existing = await this.prisma.loanApplication.findMany({
        where: { organisationId },
        select: { applicationNo: true },
      });
      const max = existing.reduce((current, item) => {
        const value = Number.parseInt(item.applicationNo, 10);
        return Number.isFinite(value) && value > current ? value : current;
      }, 0);
      applicationNo = String(max + 1).padStart(6, '0');
    }

    const duplicate = await this.prisma.loanApplication.findUnique({
      where: { organisationId_applicationNo: { organisationId, applicationNo } },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('A loan application with that number already exists.');

    const productId = body.productId ? String(body.productId).trim() : null;
    const product = productId
      ? await this.prisma.loanProduct.findFirst({ where: { id: productId, organisationId } })
      : null;
    if (productId && !product) throw new NotFoundException('Loan product not found.');

    const principalValue = body.principalMinor ?? body.principal;
    if (principalValue === undefined || principalValue === null || String(principalValue).trim() === '') {
      throw new BadRequestException('Principal amount is required.');
    }
    let principalMinor: bigint;
    try {
      principalMinor = BigInt(String(principalValue).trim());
    } catch {
      throw new BadRequestException('Principal amount must be a whole number of minor units.');
    }
    if (principalMinor <= 0n) throw new BadRequestException('Principal amount must be greater than zero.');

    if (product) {
      if (principalMinor < product.minPrincipalMinor || principalMinor > product.maxPrincipalMinor) {
        throw new BadRequestException(
          `Principal must be between ${product.minPrincipalMinor.toString()} and ${product.maxPrincipalMinor.toString()} minor units for ${product.name}.`,
        );
      }
      if (product.status !== 'ACTIVE') {
        throw new BadRequestException(`${product.name} is not active.`);
      }
    }

    const tenureCount = parseInteger(
      body.tenureCount ?? body.tenureMonths ?? body.tenure,
      'Tenure',
      1,
      600,
    );
    const tenurePeriod = parseTenurePeriod(body.tenurePeriod);
    if (
      product &&
      (tenureInMonths(tenureCount, tenurePeriod) < product.minTenureMonths ||
        tenureInMonths(tenureCount, tenurePeriod) > product.maxTenureMonths)
    ) {
      throw new BadRequestException(
        `Tenure must fall between ${product.minTenureMonths} and ${product.maxTenureMonths} months for ${product.name}.`,
      );
    }
    const interestRateBp =
      body.interestRateBp === undefined || body.interestRateBp === null || body.interestRateBp === ''
        ? product?.interestRateBp ?? 0
        : parseInteger(body.interestRateBp, 'Interest rate', 0, 100000);

    const gracePeriodMonths = parseInteger(body.gracePeriodMonths ?? 0, 'Grace period', 0, 60);
    const interestMethod = parseInterestMethod(body.interestMethod);
    const interestOnGrace = body.interestOnGrace === true;
    const installmentStartDate = parseIsoDate(body.installmentStartDate, 'Installment start date');
    if (!installmentStartDate) throw new BadRequestException('Installment start date is required.');
    const sector = parseEconomicSector(
      body.economicSector,
      body.subEconomicSector,
      body.subSubEconomicSector,
    );

    const loanOfficerId = body.loanOfficerId ? String(body.loanOfficerId).trim() : null;
    if (loanOfficerId) {
      const officer = await this.prisma.user.findFirst({
        where: { id: loanOfficerId, organisationId },
        select: { id: true },
      });
      if (!officer) throw new NotFoundException('Loan officer not found.');
    } else {
      throw new BadRequestException('Loan officer is required.');
    }

    const paymentDestination = parsePaymentDestination(body.paymentDestination);
    const bankAccountNumber = optionalText(body.bankAccountNumber);
    if (paymentDestination === 'BANK' && !bankAccountNumber) {
      throw new BadRequestException('A bank account number is required for a bank destination.');
    }
    const mnoWalletNumber = optionalText(body.mnoWalletNumber);
    if (paymentDestination === 'MNO' && !mnoWalletNumber) {
      throw new BadRequestException('A mobile money wallet is required for a wallet destination.');
    }

    const documents = parseLoanDocuments(body.documents);
    const status = body.status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT';

    const item = await this.prisma.loanApplication.create({
      data: {
        organisationId,
        branchId: body.branchId ? String(body.branchId) : client.branchId,
        clientId,
        productId: product?.id ?? null,
        loanOfficerId,
        applicationNo,
        status,
        submittedAt: status === 'SUBMITTED' ? new Date() : null,
        principalMinor,
        tenureCount,
        tenurePeriod,
        gracePeriodMonths,
        interestRateBp,
        interestMethod,
        interestOnGrace,
        installmentStartDate,
        debtCapacityMinor: parseOptionalMinor(body.debtCapacityMinor, 'Debt capacity'),
        ...sector,
        description: optionalText(body.description),
        purpose: optionalText(body.purpose),
        hasGuarantor: body.hasGuarantor === true,
        hasCollateral: body.hasCollateral === true,
        disbursementPreference: optionalText(body.disbursementPreference),
        remarks: optionalText(body.remarks),
        nomineeName: optionalText(body.nomineeName),
        nomineeRelation: optionalText(body.nomineeRelation),
        nomineePhone: optionalText(body.nomineePhone),
        nomineeIdNumber: optionalText(body.nomineeIdNumber),
        nomineePercentage:
          body.nomineePercentage === undefined || body.nomineePercentage === null || body.nomineePercentage === ''
            ? null
            : parseInteger(body.nomineePercentage, 'Nominee percentage', 1, 100),
        paymentDestination,
        bankName: optionalText(body.bankName),
        bankAccountName: optionalText(body.bankAccountName),
        bankAccountNumber,
        mnoProvider: optionalText(body.mnoProvider),
        mnoWalletNumber,
        documents: documents.length
          ? {
              create: documents.map((document) => ({
                organisation: { connect: { id: organisationId } },
                kind: document.kind,
                name: document.name,
                contentType: document.contentType,
                sizeBytes: document.data.length,
                data: new Uint8Array(document.data),
                uploadedByUserId: auth.user.id,
              })),
            }
          : undefined,
      },
      include: LOAN_APPLICATION_INCLUDE,
    });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: status === 'SUBMITTED' ? 'Loan application submitted' : 'Loan application created',
      entityType: 'LoanApplication',
      entityId: item.id,
      before: undefined,
      after: this.serializeLoanApplication(item),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { application: this.serializeLoanApplication(item), canEdit: this.can(auth, 'Loan Account : Edit') };
  }

  async updateLoanApplication(
    auth: AuthContext,
    id: string,
    body: Record<string, unknown>,
    context: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const organisationId = auth.user.organisation.id;
    const existing = await this.prisma.loanApplication.findFirst({
      where: { id, organisationId },
      include: LOAN_APPLICATION_INCLUDE,
    });
    if (!existing) throw new NotFoundException('Loan application not found.');
    if (existing.status !== 'DRAFT' && existing.status !== 'SUBMITTED') {
      throw new BadRequestException('This application can no longer be edited.');
    }

    const clientId = String(body.clientId ?? existing.clientId).trim();
    if (!clientId) throw new BadRequestException('Client is required.');
    const client = await this.prisma.client.findFirst({ where: { id: clientId, organisationId } });
    if (!client) throw new NotFoundException('Client not found.');

    const productId = body.productId ? String(body.productId).trim() : existing.productId;
    const product = productId
      ? await this.prisma.loanProduct.findFirst({ where: { id: productId, organisationId } })
      : null;
    if (productId && !product) throw new NotFoundException('Loan product not found.');

    const principalValue = body.principalMinor ?? body.principal ?? existing.principalMinor.toString();
    let principalMinor: bigint;
    try {
      principalMinor = BigInt(String(principalValue).trim());
    } catch {
      throw new BadRequestException('Principal amount must be a whole number of minor units.');
    }
    if (principalMinor <= 0n) throw new BadRequestException('Principal amount must be greater than zero.');
    if (product) {
      if (principalMinor < product.minPrincipalMinor || principalMinor > product.maxPrincipalMinor) {
        throw new BadRequestException(
          `Principal must be between ${product.minPrincipalMinor.toString()} and ${product.maxPrincipalMinor.toString()} minor units for ${product.name}.`,
        );
      }
      if (product.status !== 'ACTIVE') throw new BadRequestException(`${product.name} is not active.`);
    }

    const tenureCount = parseInteger(
      body.tenureCount ?? body.tenureMonths ?? body.tenure ?? existing.tenureCount,
      'Tenure',
      1,
      600,
    );
    const tenurePeriod = parseTenurePeriod(body.tenurePeriod ?? existing.tenurePeriod);
    if (
      product &&
      (tenureInMonths(tenureCount, tenurePeriod) < product.minTenureMonths ||
        tenureInMonths(tenureCount, tenurePeriod) > product.maxTenureMonths)
    ) {
      throw new BadRequestException(
        `Tenure must fall between ${product.minTenureMonths} and ${product.maxTenureMonths} months for ${product.name}.`,
      );
    }
    const interestRateBp =
      body.interestRateBp === undefined || body.interestRateBp === null || body.interestRateBp === ''
        ? product?.interestRateBp ?? existing.interestRateBp
        : parseInteger(body.interestRateBp, 'Interest rate', 0, 100000);

    const gracePeriodMonths = parseInteger(body.gracePeriodMonths ?? existing.gracePeriodMonths, 'Grace period', 0, 60);
    const interestMethod = parseInterestMethod(body.interestMethod ?? existing.interestMethod);
    const interestOnGrace = body.interestOnGrace === undefined ? existing.interestOnGrace : body.interestOnGrace === true;
    const installmentStartDate = parseIsoDate(body.installmentStartDate ?? existing.installmentStartDate, 'Installment start date');
    if (!installmentStartDate) throw new BadRequestException('Installment start date is required.');
    const sector = parseEconomicSector(
      body.economicSector ?? existing.economicSector,
      body.subEconomicSector ?? existing.subEconomicSector,
      body.subSubEconomicSector ?? existing.subSubEconomicSector,
    );

    const loanOfficerId = body.loanOfficerId ? String(body.loanOfficerId).trim() : existing.loanOfficerId;
    if (loanOfficerId) {
      const officer = await this.prisma.user.findFirst({ where: { id: loanOfficerId, organisationId }, select: { id: true } });
      if (!officer) throw new NotFoundException('Loan officer not found.');
    } else {
      throw new BadRequestException('Loan officer is required.');
    }

    const paymentDestination = parsePaymentDestination(body.paymentDestination ?? existing.paymentDestination);
    const bankAccountNumber = optionalText(body.bankAccountNumber ?? existing.bankAccountNumber);
    if (paymentDestination === 'BANK' && !bankAccountNumber) {
      throw new BadRequestException('A bank account number is required for a bank destination.');
    }
    const mnoWalletNumber = optionalText(body.mnoWalletNumber ?? existing.mnoWalletNumber);
    if (paymentDestination === 'MNO' && !mnoWalletNumber) {
      throw new BadRequestException('A mobile money wallet is required for a wallet destination.');
    }

    const documents = parseLoanDocuments(body.documents);
    const status = body.status === 'SUBMITTED' ? 'SUBMITTED' : existing.status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT';

    const updated = await this.prisma.loanApplication.update({
      where: { id },
      data: {
        clientId,
        productId: product?.id ?? null,
        loanOfficerId,
        status,
        submittedAt: status === 'SUBMITTED' && !existing.submittedAt ? new Date() : existing.submittedAt,
        principalMinor,
        tenureCount,
        tenurePeriod,
        gracePeriodMonths,
        interestRateBp,
        interestMethod,
        interestOnGrace,
        installmentStartDate,
        debtCapacityMinor: body.debtCapacityMinor === undefined
          ? existing.debtCapacityMinor
          : parseOptionalMinor(body.debtCapacityMinor, 'Debt capacity'),
        ...sector,
        description: body.description === undefined ? existing.description : optionalText(body.description),
        purpose: body.purpose === undefined ? existing.purpose : optionalText(body.purpose),
        hasGuarantor: body.hasGuarantor === undefined ? existing.hasGuarantor : body.hasGuarantor === true,
        hasCollateral: body.hasCollateral === undefined ? existing.hasCollateral : body.hasCollateral === true,
        disbursementPreference: body.disbursementPreference === undefined ? existing.disbursementPreference : optionalText(body.disbursementPreference),
        remarks: body.remarks === undefined ? existing.remarks : optionalText(body.remarks),
        nomineeName: body.nomineeName === undefined ? existing.nomineeName : optionalText(body.nomineeName),
        nomineeRelation: body.nomineeRelation === undefined ? existing.nomineeRelation : optionalText(body.nomineeRelation),
        nomineePhone: body.nomineePhone === undefined ? existing.nomineePhone : optionalText(body.nomineePhone),
        nomineeIdNumber: body.nomineeIdNumber === undefined ? existing.nomineeIdNumber : optionalText(body.nomineeIdNumber),
        nomineePercentage:
          body.nomineePercentage === undefined
            ? existing.nomineePercentage
            : body.nomineePercentage === null || body.nomineePercentage === ''
              ? null
              : parseInteger(body.nomineePercentage, 'Nominee percentage', 1, 100),
        paymentDestination,
        bankName: body.bankName === undefined ? existing.bankName : optionalText(body.bankName),
        bankAccountName: body.bankAccountName === undefined ? existing.bankAccountName : optionalText(body.bankAccountName),
        bankAccountNumber,
        mnoProvider: body.mnoProvider === undefined ? existing.mnoProvider : optionalText(body.mnoProvider),
        mnoWalletNumber,
        documents: documents.length
          ? {
              create: documents.map((document) => ({
                organisation: { connect: { id: organisationId } },
                kind: document.kind,
                name: document.name,
                contentType: document.contentType,
                sizeBytes: document.data.length,
                data: new Uint8Array(document.data),
                uploadedByUserId: auth.user.id,
              })),
            }
          : undefined,
      },
      include: LOAN_APPLICATION_INCLUDE,
    });

    await this.audit.record({
      organisationId,
      branchId: auth.user.branch?.id ?? null,
      actorUserId: auth.user.id,
      actorLabel: auth.user.email,
      action: 'Loan application updated',
      entityType: 'LoanApplication',
      entityId: updated.id,
      before: this.serializeLoanApplication(existing),
      after: this.serializeLoanApplication(updated),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      application: this.serializeLoanApplication(updated),
      canEdit: this.can(auth, 'Loan Account : Edit'),
      canView: this.can(auth, 'Loan Account : View'),
      canApprove: this.can(auth, 'Loan Account : Approve'),
      canReject: this.can(auth, 'Loan Account : Reject'),
      canCancel: this.can(auth, 'Loan Account : Edit') || this.can(auth, 'Loan Account : Delete'),
    };
  }

  async updateLoanApplicationStatus(
    auth: AuthContext,
    id: string,
    status: string,
  ) {
    const organisationId = auth.user.organisation.id;
    const item = await this.prisma.loanApplication.findFirst({
      where: { id, organisationId },
    });
    if (!item) throw new NotFoundException('Loan application not found.');

    const next = (status ?? '').trim().toUpperCase();
    if (!['SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(next)) {
      throw new BadRequestException('Status is not supported.');
    }

    const current = item.status;
    let allowed = false;
    if (next === 'SUBMITTED') {
      allowed = current === 'DRAFT' && (this.can(auth, 'Loan Account : Edit') || this.can(auth, 'Loan Account : Create'));
    } else if (next === 'APPROVED') {
      allowed = current === 'SUBMITTED' && this.can(auth, 'Loan Account : Approve');
    } else if (next === 'REJECTED') {
      allowed = current === 'SUBMITTED' && this.can(auth, 'Loan Account : Reject');
    } else if (next === 'CANCELLED') {
      allowed =
        (current === 'DRAFT' || current === 'SUBMITTED') &&
        (this.can(auth, 'Loan Account : Edit') || this.can(auth, 'Loan Account : Delete'));
    }
    if (!allowed) {
      throw new BadRequestException(`Cannot change status from ${current} to ${next}.`);
    }

    const updated = await this.prisma.loanApplication.update({
      where: { id },
      data: {
        status: next as 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED',
        submittedAt: next === 'SUBMITTED' ? new Date() : item.submittedAt,
      },
      include: LOAN_APPLICATION_INCLUDE,
    });

    if (next === 'APPROVED') {
      const existingLoan = await this.prisma.loan.findFirst({ where: { applicationId: id } });
      if (!existingLoan) {
        const termMonths = tenureInMonths(item.tenureCount, item.tenurePeriod);
        const annualRatePercent = item.interestRateBp / 100; // monthly bp -> ... 
        // interestRateBp is per month in bp; annual = monthly * 12
        const annualRateBp = item.interestRateBp * 12;
        const methodMap: Record<string, 'equal_instalment' | 'equal_principal' | 'flat'> = {
          REDUCING_BALANCE_EQUAL_INSTALLMENT: 'equal_instalment',
          REDUCING_BALANCE_EQUAL_PRINCIPAL: 'equal_principal',
          FLAT_RATE: 'flat',
        };
        const scheduleMethod = methodMap[item.interestMethod] ?? 'equal_instalment';

        // loan number
        const existingLoans = await this.prisma.loan.findMany({
          where: { organisationId },
          select: { loanNumber: true },
        });
        const maxLoan = existingLoans.reduce((current, l) => {
          const v = Number.parseInt(l.loanNumber.replace(/\D/g, ''), 10);
          return Number.isFinite(v) && v > current ? v : current;
        }, 0);
        const loanNumber = String(maxLoan + 1).padStart(6, '0');

        const firstDueDate = item.installmentStartDate
          ? item.installmentStartDate.toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);

        const schedule = generateSchedule({
          principal: money(item.principalMinor),
          annualRate: rate(annualRateBp, 10000),
          termMonths,
          firstDueDate,
          method: scheduleMethod,
        });

        const loan = await this.prisma.loan.create({
          data: {
            organisationId,
            branchId: item.branchId,
            clientId: item.clientId,
            productId: item.productId,
            applicationId: item.id,
            loanNumber,
            status: 'APPROVED',
            principalMinor: item.principalMinor,
            outstandingPrincipalMinor: item.principalMinor,
            tenureCount: item.tenureCount,
            tenurePeriod: item.tenurePeriod,
            interestRateBp: item.interestRateBp,
            interestMethod: item.interestMethod,
            installmentStartDate: item.installmentStartDate,
            disbursedAt: null,
          },
        });

        await this.prisma.loanSchedule.createMany({
          data: schedule.rows.map((row) => ({
            organisationId,
            loanId: loan.id,
            installmentNo: row.no,
            dueDate: new Date(row.dueDate),
            openingPrincipalMinor: BigInt(row.opening.minor),
            principalMinor: BigInt(row.principal.minor),
            interestMinor: BigInt(row.interest.minor),
            totalMinor: BigInt(row.total.minor),
            closingPrincipalMinor: BigInt(row.closing.minor),
          })),
        });
      }
    }
    return {
      application: this.serializeLoanApplication(updated),
      canEdit: this.can(auth, 'Loan Account : Edit'),
      canView: this.can(auth, 'Loan Account : View'),
      canApprove: this.can(auth, 'Loan Account : Approve'),
      canReject: this.can(auth, 'Loan Account : Reject'),
      canCancel: this.can(auth, 'Loan Account : Edit') || this.can(auth, 'Loan Account : Delete'),
    };
  }

  async listLoans(auth: AuthContext, filter: { q?: string; status?: string }) {
    const organisationId = auth.user.organisation.id;
    const where: Prisma.LoanWhereInput = { organisationId };
    const query = filter.q?.trim();
    if (query) {
      where.OR = [
        { loanNumber: { contains: query, mode: 'insensitive' } },
        { client: { fullName: { contains: query, mode: 'insensitive' } } },
        { product: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }
    if (filter.status) {
      const status = filter.status.trim().toUpperCase();
      where.status = status as any;
    }
    const items = await this.prisma.loan.findMany({
      where,
      include: LOAN_INCLUDE,
      orderBy: [{ createdAt: 'desc' }],
    });
    return {
      items: items.map((item) => this.serializeLoan(item)),
      canView: this.can(auth, 'Loan Account : View'),
    };
  }

  async getLoan(auth: AuthContext, id: string) {
    const organisationId = auth.user.organisation.id;
    const item = await this.prisma.loan.findFirst({
      where: { id, organisationId },
      include: LOAN_INCLUDE,
    });
    if (!item) throw new NotFoundException('Loan not found.');
    const schedule = await this.prisma.loanSchedule.findMany({
      where: { loanId: id },
      orderBy: [{ installmentNo: 'asc' }],
    });
    return {
      loan: this.serializeLoan(item),
      schedule: schedule.map((row) => ({
        id: row.id,
        installmentNo: row.installmentNo,
        dueDate: row.dueDate.toISOString().slice(0, 10),
        openingPrincipalMinor: row.openingPrincipalMinor.toString(),
        principalMinor: row.principalMinor.toString(),
        interestMinor: row.interestMinor.toString(),
        totalMinor: row.totalMinor.toString(),
        closingPrincipalMinor: row.closingPrincipalMinor.toString(),
        status: row.status,
        paidAt: row.paidAt ? row.paidAt.toISOString() : null,
      })),
      canView: this.can(auth, 'Loan Account : View'),
    };
  }

  private serializeLoan(item: any) {
    return {
      id: item.id,
      loanNumber: item.loanNumber,
      status: item.status,
      principalMinor: item.principalMinor.toString(),
      outstandingPrincipalMinor: item.outstandingPrincipalMinor.toString(),
      tenureCount: item.tenureCount,
      tenurePeriod: item.tenurePeriod,
      interestRateBp: item.interestRateBp,
      interestMethod: item.interestMethod,
      installmentStartDate: item.installmentStartDate ? item.installmentStartDate.toISOString().slice(0, 10) : null,
      classification: item.classification,
      daysPastDue: item.daysPastDue,
      isInsider: item.isInsider,
      disbursedAt: item.disbursedAt ? item.disbursedAt.toISOString() : null,
      clientName: item.client?.fullName ?? null,
      clientReference: item.client?.referenceNo ?? null,
      productName: item.product?.name ?? null,
      productCode: item.product?.code ?? null,
      applicationNo: item.application?.applicationNo ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async getLoanApplication(auth: AuthContext, id: string) {
    const organisationId = auth.user.organisation.id;
    const item = await this.prisma.loanApplication.findFirst({
      where: { id, organisationId },
      include: LOAN_APPLICATION_INCLUDE,
    });
    if (!item) throw new NotFoundException('Loan application not found.');
    return {
      application: this.serializeLoanApplication(item),
      canEdit: this.can(auth, 'Loan Account : Edit'),
      canView: this.can(auth, 'Loan Account : View'),
      canApprove: this.can(auth, 'Loan Account : Approve'),
      canReject: this.can(auth, 'Loan Account : Reject'),
      canCancel: this.can(auth, 'Loan Account : Edit') || this.can(auth, 'Loan Account : Delete'),
    };
  }

  async getLoanApplicationDocument(auth: AuthContext, id: string, documentId: string) {
    const organisationId = auth.user.organisation.id;
    const document = await this.prisma.loanApplicationDocument.findFirst({
      where: { id: documentId, organisationId, loanApplicationId: id },
    });
    if (!document) throw new NotFoundException('Document not found.');
    return {
      name: document.name,
      contentType: document.contentType,
      data: Buffer.from(document.data),
    };
  }

  async listLoanOfficers(auth: AuthContext) {
    const users = await this.prisma.user.findMany({
      where: { organisationId: auth.user.organisation.id, status: 'ACTIVE' },
      select: { id: true, fullName: true, email: true },
      orderBy: [{ fullName: 'asc' }],
    });
    return { items: users };
  }

  private serializeLoanApplication(item: any) {
    return {
      id: item.id,
      applicationNo: item.applicationNo,
      status: item.status,
      principalMinor: item.principalMinor.toString(),
      tenureCount: item.tenureCount,
      tenurePeriod: item.tenurePeriod,
      gracePeriodMonths: item.gracePeriodMonths,
      interestRateBp: item.interestRateBp,
      interestMethod: item.interestMethod,
      interestOnGrace: item.interestOnGrace,
      installmentStartDate: item.installmentStartDate
        ? item.installmentStartDate.toISOString().slice(0, 10)
        : null,
      debtCapacityMinor: item.debtCapacityMinor?.toString() ?? null,
      economicSector: item.economicSector,
      subEconomicSector: item.subEconomicSector,
      subSubEconomicSector: item.subSubEconomicSector,
      description: item.description,
      purpose: item.purpose,
      hasGuarantor: item.hasGuarantor,
      hasCollateral: item.hasCollateral,
      disbursementPreference: item.disbursementPreference,
      remarks: item.remarks,
      nomineeName: item.nomineeName,
      nomineeRelation: item.nomineeRelation,
      nomineePhone: item.nomineePhone,
      nomineeIdNumber: item.nomineeIdNumber,
      nomineePercentage: item.nomineePercentage,
      paymentDestination: item.paymentDestination,
      bankName: item.bankName,
      bankAccountName: item.bankAccountName,
      bankAccountNumber: item.bankAccountNumber,
      mnoProvider: item.mnoProvider,
      mnoWalletNumber: item.mnoWalletNumber,
      submittedAt: item.submittedAt ? item.submittedAt.toISOString() : null,
      clientName: item.client?.fullName ?? null,
      clientReference: item.client?.referenceNo ?? null,
      clientId: item.clientId,
      productName: item.product?.name ?? null,
      productCode: item.product?.code ?? null,
      productId: item.productId,
      loanOfficerName: item.loanOfficer?.fullName ?? null,
      loanOfficerId: item.loanOfficerId ?? null,
      documents: (item.documents ?? []).map((document: any) => ({
        id: document.id,
        kind: document.kind,
        name: document.name,
        contentType: document.contentType,
        sizeBytes: document.sizeBytes,
        createdAt: document.createdAt.toISOString(),
      })),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
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
