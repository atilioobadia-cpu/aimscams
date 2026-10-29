import { BadRequestException } from '@nestjs/common';

import {
  organisationBranchScope,
  parseRequestFilters,
  parseTransactionFilters,
} from './transactions.logic.js';

describe('organisationBranchScope', () => {
  it('limits branch users to their assigned branch', () => {
    expect(organisationBranchScope('org-1', 'branch-1')).toEqual({
      organisationId: 'org-1',
      branchId: 'branch-1',
    });
  });

  it('keeps organisation-wide users scoped to their institution', () => {
    expect(organisationBranchScope('org-1', null)).toEqual({
      organisationId: 'org-1',
    });
  });
});

describe('parseTransactionFilters', () => {
  it('trims search values and applies bounded pagination defaults', () => {
    expect(parseTransactionFilters({ q: '  TX-12  ' })).toEqual({
      q: 'TX-12',
      status: undefined,
      accountingStatus: undefined,
      category: undefined,
      from: undefined,
      to: undefined,
      tellerId: undefined,
      page: 1,
      pageSize: 20,
    });
  });

  it('accepts known status axes and date ranges', () => {
    expect(
      parseTransactionFilters({
        status: 'APPROVED',
        accountingStatus: 'FAILED',
        from: '2026-10-01',
        to: '2026-10-31',
        page: '2',
        pageSize: '50',
      }),
    ).toMatchObject({
      status: 'APPROVED',
      accountingStatus: 'FAILED',
      from: '2026-10-01',
      to: '2026-10-31',
      page: 2,
      pageSize: 50,
    });
  });

  it('rejects unsupported statuses, invalid dates, and oversized pages', () => {
    expect(() => parseTransactionFilters({ status: 'DELETED' })).toThrow(
      BadRequestException,
    );
    expect(() => parseTransactionFilters({ from: '2026-02-30' })).toThrow(
      BadRequestException,
    );
    expect(() =>
      parseTransactionFilters({ from: '2026-11-01', to: '2026-10-31' }),
    ).toThrow(BadRequestException);
    expect(() => parseTransactionFilters({ pageSize: '101' })).toThrow(
      BadRequestException,
    );
    expect(() => parseTransactionFilters({ q: 'x'.repeat(201) })).toThrow(
      BadRequestException,
    );
  });
});

describe('parseRequestFilters', () => {
  it('defaults to all requests and supports the assigned queue', () => {
    expect(
      parseRequestFilters({ assignedToMe: 'true', status: 'pending' }),
    ).toMatchObject({
      assignedToMe: true,
      status: 'PENDING',
      page: 1,
      pageSize: 20,
    });
  });

  it('rejects invalid statuses and boolean filters', () => {
    expect(() => parseRequestFilters({ status: 'OPEN' })).toThrow(
      BadRequestException,
    );
    expect(() => parseRequestFilters({ assignedToMe: 'yes' })).toThrow(
      BadRequestException,
    );
  });
});
