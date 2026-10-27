import { BadRequestException } from '@nestjs/common';

import {
  MAX_LOGO_BYTES,
  defaultBranchHours,
  normaliseBranchCode,
  parseCouncilType,
  parseHours,
  parseLogoDataUrl,
  resolveLogoUrl,
} from './settings.logic.js';

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const JPEG = '/9j/4A==';

describe('resolveLogoUrl', () => {
  it('prefers an external logo URL', () => {
    expect(resolveLogoUrl('https://example.test/logo.png', new Date(1))).toBe(
      'https://example.test/logo.png',
    );
  });

  it('cache-busts an uploaded logo', () => {
    expect(resolveLogoUrl(null, new Date(1700000000000))).toBe(
      '/settings/organisation/logo?v=1700000000000',
    );
  });

  it('returns null when no logo exists', () => {
    expect(resolveLogoUrl(null, null)).toBeNull();
  });
});

describe('parseLogoDataUrl', () => {
  it('accepts a PNG data URL and returns its bytes', () => {
    const result = parseLogoDataUrl(`data:image/png;base64,${PNG}`);
    expect(result.mime).toBe('image/png');
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('accepts a JPEG magic header', () => {
    expect(parseLogoDataUrl(`data:image/jpeg;base64,${JPEG}`).mime).toBe(
      'image/jpeg',
    );
  });

  it('rejects a declared type that does not match the bytes', () => {
    expect(() => parseLogoDataUrl(`data:image/png;base64,${JPEG}`)).toThrow(
      BadRequestException,
    );
  });

  it('rejects unsupported image types and malformed payloads', () => {
    expect(() => parseLogoDataUrl('data:image/gif;base64,R0lGODlh')).toThrow(
      BadRequestException,
    );
    expect(() => parseLogoDataUrl('not-a-data-url')).toThrow(BadRequestException);
  });

  it('rejects a logo above the byte cap', () => {
    const bytes = Buffer.alloc(MAX_LOGO_BYTES + 1);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(() =>
      parseLogoDataUrl(`data:image/png;base64,${bytes.toString('base64')}`),
    ).toThrow(BadRequestException);
  });
});

describe('normaliseBranchCode', () => {
  it('uppercases and trims a valid code', () => {
    expect(normaliseBranchCode(' mwz ')).toBe('MWZ');
    expect(normaliseBranchCode('BR-01')).toBe('BR-01');
  });

  it('rejects short, long and punctuated codes', () => {
    expect(() => normaliseBranchCode('M')).toThrow(BadRequestException);
    expect(() => normaliseBranchCode('ABCDEFGHIJK')).toThrow(BadRequestException);
    expect(() => normaliseBranchCode('MW Z')).toThrow(BadRequestException);
  });
});

describe('parseCouncilType', () => {
  it('normalises known council codes and maps blanks to null', () => {
    expect(parseCouncilType('mc')).toBe('MC');
    expect(parseCouncilType('')).toBeNull();
    expect(parseCouncilType(null)).toBeNull();
  });

  it('rejects an unknown council code', () => {
    expect(() => parseCouncilType('VILLAGE')).toThrow(BadRequestException);
  });
});

describe('parseHours', () => {
  it('accepts one row per weekday and sorts them', () => {
    const rows = defaultBranchHours().reverse();
    const parsed = parseHours(rows);
    expect(parsed?.map((row) => row.weekday)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('rejects a duplicate weekday', () => {
    const rows = defaultBranchHours();
    rows[1] = { ...rows[1], weekday: 1 };
    expect(() => parseHours(rows)).toThrow(BadRequestException);
  });

  it('rejects a missing weekday', () => {
    expect(() => parseHours(defaultBranchHours().slice(0, 6))).toThrow(
      BadRequestException,
    );
  });

  it('rejects a closing time before opening', () => {
    const rows = defaultBranchHours();
    rows[0] = { ...rows[0], opensMinute: 600, closesMinute: 540 };
    expect(() => parseHours(rows)).toThrow(BadRequestException);
  });

  it('zeroes the times of a closed day', () => {
    const rows = defaultBranchHours();
    const parsed = parseHours([
      ...rows.slice(0, 6),
      { weekday: 7, isClosed: true, opensMinute: 500, closesMinute: 600 },
    ]);
    expect(parsed?.[6]).toEqual({
      weekday: 7,
      isClosed: true,
      opensMinute: 0,
      closesMinute: 0,
    });
  });
});
