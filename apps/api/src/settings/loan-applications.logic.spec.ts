import { BadRequestException } from '@nestjs/common';

import {
  ECONOMIC_SECTORS,
  MAX_DOCUMENT_BYTES,
  parseEconomicSector,
  parseInterestMethod,
  parseIsoDate,
  parseLoanDocuments,
  parseOptionalMinor,
  parsePaymentDestination,
  parseTenurePeriod,
  tenureInMonths,
} from './loan-applications.logic.js';

const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

describe('parseEconomicSector', () => {
  it('accepts a leaf under its own sector and sub-sector', () => {
    expect(parseEconomicSector('A', 'A01', 'A0111')).toEqual({
      economicSector: 'A',
      subEconomicSector: 'A01',
      subSubEconomicSector: 'A0111',
    });
  });

  it('requires the top-level sector', () => {
    expect(() => parseEconomicSector('', null, null)).toThrow(BadRequestException);
  });

  it('rejects a sector outside the code list', () => {
    expect(() => parseEconomicSector('Z9', null, null)).toThrow(BadRequestException);
  });

  it('rejects a sub-sector from another sector', () => {
    expect(() => parseEconomicSector('A', 'C10', null)).toThrow(BadRequestException);
  });

  it('rejects a leaf from another sub-sector', () => {
    expect(() => parseEconomicSector('A', 'A01', 'C1011')).toThrow(BadRequestException);
  });

  it('keeps every leaf reachable through its parents', () => {
    for (const sector of ECONOMIC_SECTORS) {
      for (const sub of sector.children) {
        for (const leaf of sub.children) {
          expect(() => parseEconomicSector(sector.code, sub.code, leaf.code)).not.toThrow();
        }
      }
    }
  });
});

describe('parseTenurePeriod and parseInterestMethod', () => {
  it('defaults to months and reducing balance', () => {
    expect(parseTenurePeriod(undefined)).toBe('MONTHS');
    expect(parseInterestMethod(undefined)).toBe('REDUCING_BALANCE_EQUAL_INSTALLMENT');
  });

  it('rejects an unknown tenure period', () => {
    expect(() => parseTenurePeriod('YEARS')).toThrow(BadRequestException);
  });

  it('rejects an unknown interest method', () => {
    expect(() => parseInterestMethod('SIMPLE')).toThrow(BadRequestException);
  });
});

describe('tenureInMonths', () => {
  it('keeps months unchanged', () => {
    expect(tenureInMonths(12, 'MONTHS')).toBe(12);
  });

  it('rounds weeks up to whole months', () => {
    expect(tenureInMonths(4, 'WEEKS')).toBe(1);
    expect(tenureInMonths(6, 'WEEKS')).toBe(2);
  });

  it('rounds days up to whole months', () => {
    expect(tenureInMonths(30, 'DAYS')).toBe(1);
    expect(tenureInMonths(45, 'DAYS')).toBe(2);
  });
});

describe('parsePaymentDestination', () => {
  it('returns null when absent', () => {
    expect(parsePaymentDestination(undefined)).toBeNull();
  });

  it('accepts the three destinations', () => {
    expect(parsePaymentDestination('bank')).toBe('BANK');
    expect(parsePaymentDestination('MNO')).toBe('MNO');
    expect(parsePaymentDestination('CASH')).toBe('CASH');
  });

  it('rejects anything else', () => {
    expect(() => parsePaymentDestination('CHEQUE')).toThrow(BadRequestException);
  });
});

describe('parseOptionalMinor', () => {
  it('returns null for an empty value', () => {
    expect(parseOptionalMinor('', 'Debt capacity')).toBeNull();
  });

  it('parses a whole number of minor units', () => {
    expect(parseOptionalMinor('2500000', 'Debt capacity')).toBe(2500000n);
  });

  it('rejects a negative amount', () => {
    expect(() => parseOptionalMinor('-1', 'Debt capacity')).toThrow(BadRequestException);
  });

  it('rejects a decimal', () => {
    expect(() => parseOptionalMinor('10.5', 'Debt capacity')).toThrow(BadRequestException);
  });
});

describe('parseIsoDate', () => {
  it('parses a plain date at UTC midnight', () => {
    expect(parseIsoDate('2026-11-01', 'Installment start date')?.toISOString()).toBe(
      '2026-11-01T00:00:00.000Z',
    );
  });

  it('returns null when empty', () => {
    expect(parseIsoDate('', 'Installment start date')).toBeNull();
  });

  it('rejects an invalid date', () => {
    expect(() => parseIsoDate('not-a-date', 'Installment start date')).toThrow(
      BadRequestException,
    );
  });
});

describe('parseLoanDocuments', () => {
  it('accepts a PNG payload', () => {
    const documents = parseLoanDocuments([
      { kind: 'NATIONAL_ID', name: 'id.png', dataUrl: `data:image/png;base64,${PNG}` },
    ]);
    expect(documents).toHaveLength(1);
    expect(documents[0].contentType).toBe('image/png');
    expect(documents[0].data.length).toBeGreaterThan(0);
  });

  it('returns an empty list when no documents are sent', () => {
    expect(parseLoanDocuments(undefined)).toEqual([]);
  });

  it('rejects a mismatched signature', () => {
    expect(() =>
      parseLoanDocuments([
        { kind: 'OTHER', name: 'id.png', dataUrl: `data:application/pdf;base64,${PNG}` },
      ]),
    ).toThrow(BadRequestException);
  });

  it('rejects an unsupported document type', () => {
    expect(() =>
      parseLoanDocuments([
        { kind: 'PAYSLIP', name: 'x.gif', dataUrl: 'data:image/gif;base64,R0lGODlh' },
      ]),
    ).toThrow(BadRequestException);
  });

  it('rejects more documents than the limit', () => {
    const rows = Array.from({ length: 6 }, () => ({
      kind: 'OTHER',
      name: 'id.png',
      dataUrl: `data:image/png;base64,${PNG}`,
    }));
    expect(() => parseLoanDocuments(rows)).toThrow(BadRequestException);
  });

  it('rejects a payload above the size cap', () => {
    const oversized = Buffer.alloc(MAX_DOCUMENT_BYTES + 1);
    oversized[0] = 0x89;
    oversized[1] = 0x50;
    oversized[2] = 0x4e;
    oversized[3] = 0x47;
    expect(() =>
      parseLoanDocuments([
        {
          kind: 'OTHER',
          name: 'big.png',
          dataUrl: `data:image/png;base64,${oversized.toString('base64')}`,
        },
      ]),
    ).toThrow(BadRequestException);
  });
});
