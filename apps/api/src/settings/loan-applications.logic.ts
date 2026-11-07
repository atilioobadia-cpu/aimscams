import { BadRequestException } from '@nestjs/common';

/**
 * Loan application wizard rules (AC-02).
 *
 * Field validation lives here so the controller, the service and the tests share one
 * definition. Money stays in integer minor units; nothing in this module produces a float.
 */

export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
export const MAX_DOCUMENTS = 5;

export const TENURE_PERIODS = ['DAYS', 'WEEKS', 'MONTHS'] as const;
export type TenurePeriod = (typeof TENURE_PERIODS)[number];

export const INTEREST_METHODS = [
  'REDUCING_BALANCE_EQUAL_INSTALLMENT',
  'REDUCING_BALANCE_EQUAL_PRINCIPAL',
  'FLAT_RATE',
] as const;
export type InterestMethod = (typeof INTEREST_METHODS)[number];

export const PAYMENT_DESTINATIONS = ['BANK', 'MNO', 'CASH'] as const;
export type PaymentDestinationValue = (typeof PAYMENT_DESTINATIONS)[number];

export const DOCUMENT_KINDS = [
  'NATIONAL_ID',
  'PAYSLIP',
  'BANK_STATEMENT',
  'BUSINESS_LICENSE',
  'COLLATERAL',
  'OTHER',
] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

/**
 * Three-level economic sector list used by the MSP03 sectoral return.
 *
 * Codes are synthetic but stable: the leaf code is what the return rolls up, so a loan
 * must sit on a leaf, never on a branch. Replace this seed with the published taxonomy
 * when the regulator's code list is confirmed.
 */
export type EconomicSector = {
  code: string;
  name: string;
  children: { code: string; name: string; children: { code: string; name: string }[] }[];
};

export const ECONOMIC_SECTORS: EconomicSector[] = [
  {
    code: 'A',
    name: 'Agriculture, forestry and fishing',
    children: [
      {
        code: 'A01',
        name: 'Crop and animal production',
        children: [
          { code: 'A0111', name: 'Maize and cereal growing' },
          { code: 'A0112', name: 'Horticulture and vegetables' },
          { code: 'A0141', name: 'Dairy and livestock keeping' },
        ],
      },
      {
        code: 'A02',
        name: 'Fishing and aquaculture',
        children: [
          { code: 'A0311', name: 'Inland fishing' },
          { code: 'A0321', name: 'Fish farming' },
        ],
      },
    ],
  },
  {
    code: 'C',
    name: 'Manufacturing',
    children: [
      {
        code: 'C10',
        name: 'Food and beverage production',
        children: [
          { code: 'C1011', name: 'Grain milling' },
          { code: 'C1071', name: 'Bakery and confectionery' },
        ],
      },
      {
        code: 'C14',
        name: 'Textiles and apparel',
        children: [
          { code: 'C1410', name: 'Tailoring and garments' },
          { code: 'C1430', name: 'Knitted fabrics' },
        ],
      },
    ],
  },
  {
    code: 'G',
    name: 'Wholesale and retail trade',
    children: [
      {
        code: 'G46',
        name: 'Wholesale trade',
        children: [
          { code: 'G4620', name: 'Farm produce wholesale' },
          { code: 'G4649', name: 'Household goods wholesale' },
        ],
      },
      {
        code: 'G47',
        name: 'Retail trade',
        children: [
          { code: 'G4711', name: 'General merchandise retail' },
          { code: 'G4781', name: 'Market stall and kiosk retail' },
        ],
      },
    ],
  },
  {
    code: 'H',
    name: 'Transport and storage',
    children: [
      {
        code: 'H49',
        name: 'Land transport',
        children: [
          { code: 'H4921', name: 'Passenger transport' },
          { code: 'H4923', name: 'Freight transport' },
        ],
      },
      {
        code: 'H52',
        name: 'Warehousing and support',
        children: [{ code: 'H5210', name: 'Storage and warehousing' }],
      },
    ],
  },
  {
    code: 'I',
    name: 'Accommodation and food service',
    children: [
      {
        code: 'I56',
        name: 'Food and beverage service',
        children: [
          { code: 'I5610', name: 'Restaurants and cafés' },
          { code: 'I5630', name: 'Bars and refreshment stands' },
        ],
      },
    ],
  },
  {
    code: 'J',
    name: 'Information and communication',
    children: [
      {
        code: 'J61',
        name: 'Telecommunications',
        children: [{ code: 'J6120', name: 'Mobile and data services' }],
      },
    ],
  },
  {
    code: 'M',
    name: 'Professional and technical services',
    children: [
      {
        code: 'M69',
        name: 'Legal and accounting',
        children: [{ code: 'M6920', name: 'Accounting and bookkeeping' }],
      },
    ],
  },
  {
    code: 'P',
    name: 'Education',
    children: [
      {
        code: 'P85',
        name: 'Education services',
        children: [
          { code: 'P8510', name: 'Primary education' },
          { code: 'P8530', name: 'Vocational training' },
        ],
      },
    ],
  },
  {
    code: 'Q',
    name: 'Health and social work',
    children: [
      {
        code: 'Q86',
        name: 'Human health activities',
        children: [{ code: 'Q8620', name: 'Medical and dental practice' }],
      },
    ],
  },
  {
    code: 'S',
    name: 'Other service activities',
    children: [
      {
        code: 'S96',
        name: 'Personal services',
        children: [
          { code: 'S9602', name: 'Hairdressing and beauty' },
          { code: 'S9620', name: 'Laundry and cleaning' },
        ],
      },
    ],
  },
];

type SectorSelection = {
  economicSector: string;
  subEconomicSector: string | null;
  subSubEconomicSector: string | null;
};

/**
 * Validates the three-level sector drop-downs against the code list.
 *
 * A sub-sector is only accepted under the sector it belongs to, and a leaf only under
 * its parent. Free text would break the MSP03 roll-up, so it is rejected.
 */
export function parseEconomicSector(
  sectorValue: unknown,
  subValue: unknown,
  subSubValue: unknown,
): SectorSelection {
  const sectorCode = textOf(sectorValue);
  if (!sectorCode) throw new BadRequestException('Economic sector is required.');

  const sector = ECONOMIC_SECTORS.find((item) => item.code === sectorCode);
  if (!sector) throw new BadRequestException('Economic sector is not in the code list.');

  const subCode = textOf(subValue);
  if (!subCode) return { economicSector: sector.code, subEconomicSector: null, subSubEconomicSector: null };

  const sub = sector.children.find((item) => item.code === subCode);
  if (!sub) {
    throw new BadRequestException('Sub-economic sector does not belong to the selected sector.');
  }

  const leafCode = textOf(subSubValue);
  if (!leafCode) return { economicSector: sector.code, subEconomicSector: sub.code, subSubEconomicSector: null };

  const leaf = sub.children.find((item) => item.code === leafCode);
  if (!leaf) {
    throw new BadRequestException(
      'Sub-sub economic sector does not belong to the selected sub-sector.',
    );
  }

  return { economicSector: sector.code, subEconomicSector: sub.code, subSubEconomicSector: leaf.code };
}

/**
 * Converts a tenure count and its unit into whole months so it can be compared with a
 * product's month-based tenure range. Partial months round up: 45 days is two months.
 */
export function tenureInMonths(count: number, period: TenurePeriod): number {
  if (period === 'DAYS') return Math.ceil(count / 30);
  if (period === 'WEEKS') return Math.ceil((count * 7) / 30);
  return count;
}

export function tenureInDays(count: number, period: TenurePeriod): number {
  if (period === 'DAYS') return count;
  if (period === 'WEEKS') return count * 7;
  return count * 30;
}

export function parseTenurePeriod(value: unknown): TenurePeriod {
  const code = textOf(value).toUpperCase() || 'MONTHS';
  if (!(TENURE_PERIODS as readonly string[]).includes(code)) {
    throw new BadRequestException('Tenure period must be days, weeks or months.');
  }
  return code as TenurePeriod;
}

export function parseInterestMethod(value: unknown): InterestMethod {
  const code = textOf(value).toUpperCase() || 'REDUCING_BALANCE_EQUAL_INSTALLMENT';
  if (!(INTEREST_METHODS as readonly string[]).includes(code)) {
    throw new BadRequestException('Interest calculation method is not supported.');
  }
  return code as InterestMethod;
}

export function parsePaymentDestination(value: unknown): PaymentDestinationValue | null {
  const code = textOf(value).toUpperCase();
  if (!code) return null;
  if (!(PAYMENT_DESTINATIONS as readonly string[]).includes(code)) {
    throw new BadRequestException('Payment destination must be bank, mobile money or cash.');
  }
  return code as PaymentDestinationValue;
}

export function parseDocumentKind(value: unknown): DocumentKind {
  const code = textOf(value).toUpperCase() || 'OTHER';
  if (!(DOCUMENT_KINDS as readonly string[]).includes(code)) {
    throw new BadRequestException('Document type is not supported.');
  }
  return code as DocumentKind;
}

export type ParsedDocument = {
  kind: DocumentKind;
  name: string;
  contentType: string;
  data: Buffer;
};

/**
 * Accepts one attachment as `{ kind, name, dataUrl }`.
 *
 * Only PDF, PNG and JPEG are accepted, and the payload must be a base64 data URL that
 * declares the same MIME type as the bytes. Size is capped per file.
 */
export function parseLoanDocument(value: unknown): ParsedDocument {
  if (!value || typeof value !== 'object') {
    throw new BadRequestException('Each document must be an object.');
  }
  const row = value as Record<string, unknown>;
  const kind = parseDocumentKind(row.kind);
  const name = textOf(row.name).slice(0, 160);
  if (!name) throw new BadRequestException('Each document needs a file name.');

  const dataUrl = textOf(row.dataUrl);
  const match = /^data:(application\/pdf|image\/png|image\/jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
    dataUrl,
  );
  if (!match) {
    throw new BadRequestException('Documents must be a base64 PDF, PNG or JPEG.');
  }
  const contentType = match[1];
  const data = Buffer.from(match[2], 'base64');
  if (data.length === 0) throw new BadRequestException('A document file is empty.');
  if (data.length > MAX_DOCUMENT_BYTES) {
    throw new BadRequestException(
      `Each document must be ${Math.floor(MAX_DOCUMENT_BYTES / (1024 * 1024))} MB or smaller.`,
    );
  }
  if (!matchesSignature(contentType, data)) {
    throw new BadRequestException('A document does not match its declared file type.');
  }

  return { kind, name, contentType, data };
}

export function parseLoanDocuments(value: unknown): ParsedDocument[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new BadRequestException('Documents must be a list.');
  if (value.length > MAX_DOCUMENTS) {
    throw new BadRequestException(`Attach at most ${MAX_DOCUMENTS} documents.`);
  }
  return value.map(parseLoanDocument);
}

export function requireDocumentsForSubmission({
  status,
  newDocumentCount,
  existingDocumentCount = 0,
}: {
  status: 'DRAFT' | 'SUBMITTED';
  newDocumentCount: number;
  existingDocumentCount?: number;
}): void {
  if (status === 'SUBMITTED' && newDocumentCount + existingDocumentCount === 0) {
    throw new BadRequestException('Attach at least one loan document.');
  }
}

export type NextOfKinEntry = {
  fullName: string;
  relation: string;
  phone: string;
  idNumber: string | null;
  percentage: number | null;
};

export type LoanApplicationGuarantorEntry = {
  category: 'SAVINGS' | 'SHARES' | 'OTHER';
  clientId: string | null;
  guaranteeType: 'PERCENTAGE' | 'AMOUNT';
  value: string;
  blockFund: boolean;
};

export type LoanApplicationCollateralEntry = {
  assetName: string;
  assetType: string;
  currentValuationMinor: string;
  blockAmountMinor: string;
  comment: string;
  documentName: string;
};

export function parseNextOfKinEntries(value: unknown): NextOfKinEntry[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new BadRequestException('Next of kin entries must be a list.');
  if (value.length > 10) throw new BadRequestException('Add at most ten next of kin entries.');

  return value.map((entry: unknown, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new BadRequestException(`Next of kin ${index + 1} is invalid.`);
    }
    const row = entry as Record<string, unknown>;
    const fullName = typeof row.fullName === 'string' ? row.fullName.trim() : '';
    const relation = typeof row.relation === 'string' ? row.relation.trim() : '';
    const phone = typeof row.phone === 'string' ? row.phone.trim() : '';
    const idNumber = typeof row.idNumber === 'string' && row.idNumber.trim() ? row.idNumber.trim() : null;
    const percentText = row.percentage === null || row.percentage === undefined || row.percentage === ''
      ? null
      : String(row.percentage).trim();
    const percentage = percentText === null ? null : Number(percentText);

    if (!fullName || !relation || !phone) {
      throw new BadRequestException(`Next of kin ${index + 1} requires a name, relationship and phone number.`);
    }
    if (percentage !== null && (!Number.isInteger(percentage) || percentage < 1 || percentage > 100)) {
      throw new BadRequestException(`Next of kin ${index + 1} percentage must be between 1 and 100.`);
    }
    return { fullName, relation, phone, idNumber, percentage };
  });
}

function recordValue(value: unknown, field: string, index: number): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException(`${field} ${index + 1} is invalid.`);
  }
  return value as Record<string, unknown>;
}

export function parseLoanApplicationGuarantors(value: unknown): LoanApplicationGuarantorEntry[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new BadRequestException('Guarantors must be a list.');
  if (value.length > 30) throw new BadRequestException('Add at most 30 guarantors.');
  return value.map((item, index) => {
    const row = recordValue(item, 'Guarantor', index);
    const category = String(row.category ?? '').toUpperCase();
    if (category !== 'SAVINGS' && category !== 'SHARES' && category !== 'OTHER') {
      throw new BadRequestException(`Guarantor ${index + 1} category is invalid.`);
    }
    const guaranteeType = String(row.guaranteeType ?? '').toUpperCase();
    if (guaranteeType !== 'PERCENTAGE' && guaranteeType !== 'AMOUNT') {
      throw new BadRequestException(`Guarantor ${index + 1} guarantee type is invalid.`);
    }
    const clientId = typeof row.clientId === 'string' && row.clientId.trim() ? row.clientId.trim() : null;
    const valueText = String(row.value ?? '').trim();
    if (!clientId) throw new BadRequestException(`Select a member for guarantor ${index + 1}.`);
    if (!valueText) throw new BadRequestException(`Enter a guarantee value for guarantor ${index + 1}.`);
    if (guaranteeType === 'PERCENTAGE') {
      const percent = Number(valueText);
      if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
        throw new BadRequestException(`Guarantor ${index + 1} percentage must be between 1 and 100.`);
      }
    } else {
      try {
        if (BigInt(valueText) <= 0n) throw new Error('non-positive');
      } catch {
        throw new BadRequestException(`Guarantor ${index + 1} amount must be a positive minor-unit value.`);
      }
    }
    return {
      category,
      clientId,
      guaranteeType,
      value: valueText,
      blockFund: row.blockFund === true,
    };
  });
}

export function parseLoanApplicationCollaterals(value: unknown): LoanApplicationCollateralEntry[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new BadRequestException('Collaterals must be a list.');
  if (value.length > 30) throw new BadRequestException('Add at most 30 collaterals.');
  return value.map((item, index) => {
    const row = recordValue(item, 'Collateral', index);
    const assetName = typeof row.assetName === 'string' ? row.assetName.trim() : '';
    const assetType = typeof row.assetType === 'string' ? row.assetType.trim() : '';
    const currentValuationMinor = String(row.currentValuationMinor ?? '').trim();
    const blockAmountMinor = String(row.blockAmountMinor ?? '').trim();
    const comment = typeof row.comment === 'string' ? row.comment.trim() : '';
    const documentName = typeof row.documentName === 'string' ? row.documentName.trim() : '';
    if (!assetName || !assetType || !comment || !documentName) {
      throw new BadRequestException(`Collateral ${index + 1} requires asset name, asset type, comment and a document.`);
    }
    let valuation: bigint;
    let blockAmount: bigint;
    try {
      valuation = BigInt(currentValuationMinor);
      blockAmount = BigInt(blockAmountMinor);
    } catch {
      throw new BadRequestException(`Collateral ${index + 1} valuation and block amount must be valid minor-unit values.`);
    }
    if (valuation <= 0n || blockAmount <= 0n || blockAmount > valuation) {
      throw new BadRequestException(`Collateral ${index + 1} block amount must be positive and cannot exceed its valuation.`);
    }
    return { assetName, assetType, currentValuationMinor, blockAmountMinor, comment, documentName };
  });
}

export function parseOptionalMinor(value: unknown, field: string): bigint | null {
  if (value === undefined || value === null) return null;
  const text = textOf(value);
  if (!text) return null;
  let amount: bigint;
  try {
    amount = BigInt(text);
  } catch {
    throw new BadRequestException(`${field} must be a whole number of minor units.`);
  }
  if (amount < 0n) throw new BadRequestException(`${field} cannot be negative.`);
  return amount;
}

export function parseIsoDate(value: unknown, field: string): Date | null {
  const text = textOf(value);
  if (!text) return null;
  const parsed = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${field} must be a valid date.`);
  }
  return parsed;
}

export function matchesSignature(contentType: string, data: Buffer): boolean {
  if (contentType === 'application/pdf') {
    return data.length >= 5 && data.toString('ascii', 0, 5) === '%PDF-';
  }
  if (contentType === 'image/png') {
    return (
      data.length >= 8 &&
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47
    );
  }
  return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
