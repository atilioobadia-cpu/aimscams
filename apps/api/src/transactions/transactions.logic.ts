import { BadRequestException } from '@nestjs/common';

const TRANSACTION_STATUSES = [
  'SUBMITTED',
  'APPROVED',
  'REVERSED',
  'CANCELLED',
] as const;
const ACCOUNTING_STATUSES = ['PENDING', 'POSTED', 'FAILED'] as const;
const REQUEST_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;
const MAX_PAGE_SIZE = 100;

export interface TransactionFilters {
  q?: string;
  status?: (typeof TRANSACTION_STATUSES)[number];
  accountingStatus?: (typeof ACCOUNTING_STATUSES)[number];
  category?: string;
  from?: string;
  to?: string;
  tellerId?: string;
  page: number;
  pageSize: number;
}

export interface RequestFilters {
  q?: string;
  status?: (typeof REQUEST_STATUSES)[number];
  requestType?: string;
  assignedToMe: boolean;
  page: number;
  pageSize: number;
}

type FilterQuery = Readonly<Record<string, unknown>>;

export function organisationBranchScope(
  organisationId: string,
  branchId: string | null,
) {
  return branchId ? { organisationId, branchId } : { organisationId };
}

function optionalText(query: FilterQuery, key: string): string | undefined {
  const value = query[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new BadRequestException(`${key} must be a single text value.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > 200) {
    throw new BadRequestException(`${key} must be 200 characters or fewer.`);
  }
  return trimmed || undefined;
}

function optionalChoice<const T extends readonly string[]>(
  query: FilterQuery,
  key: string,
  choices: T,
): T[number] | undefined {
  const value = optionalText(query, key)?.toUpperCase();
  if (value === undefined) return undefined;
  const choice = choices.find((candidate) => candidate === value);
  if (!choice) throw new BadRequestException(`${key} is not supported.`);
  return choice;
}

function optionalIsoDate(query: FilterQuery, key: string): string | undefined {
  const value = optionalText(query, key);
  if (value === undefined) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${key} must use YYYY-MM-DD.`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException(`${key} must be a valid date.`);
  }
  return value;
}

function paginationValue(
  query: FilterQuery,
  key: 'page' | 'pageSize',
  fallback: number,
  maximum: number,
): number {
  const value = optionalText(query, key);
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value))
    throw new BadRequestException(`${key} must be a whole number.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new BadRequestException(`${key} must be between 1 and ${maximum}.`);
  }
  return parsed;
}

function optionalUuid(query: FilterQuery, key: string): string | undefined {
  const value = optionalText(query, key);
  if (value === undefined) return undefined;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new BadRequestException(`${key} must be a valid identifier.`);
  }
  return value;
}

export function parseTransactionFilters(
  query: FilterQuery,
): TransactionFilters {
  const from = optionalIsoDate(query, 'from');
  const to = optionalIsoDate(query, 'to');
  if (from && to && from > to) {
    throw new BadRequestException('from must be on or before to.');
  }

  return {
    q: optionalText(query, 'q'),
    status: optionalChoice(query, 'status', TRANSACTION_STATUSES),
    accountingStatus: optionalChoice(
      query,
      'accountingStatus',
      ACCOUNTING_STATUSES,
    ),
    category: optionalText(query, 'category'),
    from,
    to,
    tellerId: optionalUuid(query, 'tellerId'),
    page: paginationValue(query, 'page', 1, 1_000_000),
    pageSize: paginationValue(query, 'pageSize', 20, MAX_PAGE_SIZE),
  };
}

export function parseRequestFilters(query: FilterQuery): RequestFilters {
  const assignedToMeValue = optionalText(query, 'assignedToMe');
  if (
    assignedToMeValue &&
    assignedToMeValue !== 'true' &&
    assignedToMeValue !== 'false'
  ) {
    throw new BadRequestException('assignedToMe must be true or false.');
  }
  return {
    q: optionalText(query, 'q'),
    status: optionalChoice(query, 'status', REQUEST_STATUSES),
    requestType: optionalText(query, 'requestType'),
    assignedToMe: assignedToMeValue === 'true',
    page: paginationValue(query, 'page', 1, 1_000_000),
    pageSize: paginationValue(query, 'pageSize', 20, MAX_PAGE_SIZE),
  };
}
