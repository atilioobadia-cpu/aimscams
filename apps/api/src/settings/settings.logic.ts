import { BadRequestException } from '@nestjs/common';

export const MAX_LOGO_BYTES = 48 * 1024;

export const COUNCIL_TYPES = ['CC', 'MC', 'DC', 'TC'] as const;
export type CouncilType = (typeof COUNCIL_TYPES)[number];

export type BranchHourInput = {
  weekday: number;
  isClosed: boolean;
  opensMinute: number;
  closesMinute: number;
};

const LOGO_PATTERN = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

const MAGIC: Record<string, (bytes: Buffer) => boolean> = {
  'image/png': (bytes) =>
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a,
  'image/jpeg': (bytes) =>
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  'image/webp': (bytes) =>
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP',
};

export function resolveLogoUrl(
  logoUrl: string | null | undefined,
  logoUpdatedAt: Date | null | undefined,
): string | null {
  if (logoUrl) return logoUrl;
  if (logoUpdatedAt) return `/settings/organisation/logo?v=${logoUpdatedAt.getTime()}`;
  return null;
}

export function parseLogoDataUrl(value: unknown): { mime: string; data: Buffer } {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestException('Upload a PNG, JPEG or WebP logo.');
  }
  const match = LOGO_PATTERN.exec(value.trim());
  if (!match) {
    throw new BadRequestException('Logo must be a base64 PNG, JPEG or WebP image.');
  }

  const mime = match[1];
  const data = Buffer.from(match[2], 'base64');
  if (data.length === 0) {
    throw new BadRequestException('The logo file is empty.');
  }
  if (data.length > MAX_LOGO_BYTES) {
    throw new BadRequestException(
      `Logo must be ${Math.floor(MAX_LOGO_BYTES / 1024)} KB or smaller.`,
    );
  }
  if (!MAGIC[mime](data)) {
    throw new BadRequestException('The logo bytes do not match the declared image type.');
  }

  return { mime, data };
}

export function normaliseBranchCode(value: unknown): string {
  const code = textValue(value).trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{1,9}$/.test(code)) {
    throw new BadRequestException(
      'Branch code must be 2 to 10 letters, digits or hyphens.',
    );
  }
  return code;
}

export function textValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function optionalText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = textValue(value).trim();
  return text === '' ? null : text;
}

export function requiredText(value: unknown, field: string): string {
  const text = textValue(value).trim();
  if (!text) throw new BadRequestException(`${field} is required.`);
  return text;
}

export function parseInteger(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new BadRequestException(`${field} must be a whole number.`);
  }
  if (value < minimum || value > maximum) {
    throw new BadRequestException(`${field} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

export function parseCouncilType(value: unknown): CouncilType | null {
  if (value === undefined || value === null || value === '') return null;
  const code = textValue(value).trim().toUpperCase();
  if (!(COUNCIL_TYPES as readonly string[]).includes(code)) {
    throw new BadRequestException('Council type must be CC, MC, DC or TC.');
  }
  return code as CouncilType;
}

export function parseBranchStatus(value: unknown, fallback?: 'OPEN' | 'CLOSED') {
  if (value === undefined || value === null || value === '') {
    if (fallback) return fallback;
    throw new BadRequestException('Branch status is required.');
  }
  const status = textValue(value).trim().toUpperCase();
  if (status !== 'OPEN' && status !== 'CLOSED') {
    throw new BadRequestException('Branch status must be Open or Closed.');
  }
  return status;
}

export function defaultBranchHours(): BranchHourInput[] {
  return [
    { weekday: 1, isClosed: false, opensMinute: 8 * 60, closesMinute: 17 * 60 },
    { weekday: 2, isClosed: false, opensMinute: 8 * 60, closesMinute: 17 * 60 },
    { weekday: 3, isClosed: false, opensMinute: 8 * 60, closesMinute: 17 * 60 },
    { weekday: 4, isClosed: false, opensMinute: 8 * 60, closesMinute: 17 * 60 },
    { weekday: 5, isClosed: false, opensMinute: 8 * 60, closesMinute: 17 * 60 },
    { weekday: 6, isClosed: false, opensMinute: 8 * 60, closesMinute: 13 * 60 },
    { weekday: 7, isClosed: true, opensMinute: 0, closesMinute: 0 },
  ];
}

export function parseHours(value: unknown): BranchHourInput[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length !== 7) {
    throw new BadRequestException('Opening hours need one row for each day of the week.');
  }

  const seen = new Set<number>();
  const rows = value.map((raw): BranchHourInput => {
    if (!raw || typeof raw !== 'object') {
      throw new BadRequestException('Each opening-hours row must be an object.');
    }
    const row = raw as Record<string, unknown>;
    const weekday = parseInteger(row.weekday, 'Weekday', 1, 7);
    if (seen.has(weekday)) {
      throw new BadRequestException('Opening hours contain a duplicate weekday.');
    }
    seen.add(weekday);

    const isClosed = row.isClosed === true;
    if (isClosed) {
      return { weekday, isClosed: true, opensMinute: 0, closesMinute: 0 };
    }

    const opensMinute = parseInteger(row.opensMinute, 'Opening time', 0, 1439);
    const closesMinute = parseInteger(row.closesMinute, 'Closing time', 1, 1440);
    if (closesMinute <= opensMinute) {
      throw new BadRequestException('Closing time must be after opening time.');
    }
    return { weekday, isClosed: false, opensMinute, closesMinute };
  });

  if (seen.size !== 7) {
    throw new BadRequestException('Opening hours must cover all seven weekdays.');
  }
  return rows.sort((left, right) => left.weekday - right.weekday);
}
