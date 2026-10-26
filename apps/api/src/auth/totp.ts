import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

export interface TotpVerification {
  counter: number;
}

export function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function decodeBase32(input: string): Buffer {
  const normalized = input
    .replace(/=+$/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const character of normalized) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index < 0) {
      throw new Error('Invalid base32 secret.');
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

export function generateTotpSecret(bytes = 20): string {
  return encodeBase32(randomBytes(bytes));
}

export function generateTotpCode(
  secret: string,
  counter: number,
  digits = TOTP_DIGITS,
): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', decodeBase32(secret))
    .update(counterBuffer)
    .digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return String(binary % 10 ** digits).padStart(digits, '0');
}

export function verifyTotp(
  secret: string,
  token: string,
  options: { window?: number; now?: number; digits?: number } = {},
): TotpVerification | null {
  const normalized = token.replace(/\s+/g, '');
  const digits = options.digits ?? TOTP_DIGITS;
  if (!new RegExp(`^\\d{${digits}}$`).test(normalized)) {
    return null;
  }

  const counter = Math.floor(
    (options.now ?? Date.now()) / 1_000 / TOTP_PERIOD_SECONDS,
  );
  const window = options.window ?? 1;

  for (let offset = -window; offset <= window; offset += 1) {
    const candidateCounter = counter + offset;
    if (candidateCounter < 0) {
      continue;
    }
    const candidate = generateTotpCode(secret, candidateCounter, digits);
    if (constantTimeStringEqual(normalized, candidate)) {
      return { counter: candidateCounter };
    }
  }

  return null;
}

export function totpUri(input: {
  secret: string;
  email: string;
  issuer?: string;
}): string {
  const issuer = input.issuer ?? 'AIMSCAMS';
  const label = `${issuer}:${input.email}`;
  const params = new URLSearchParams({
    secret: input.secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

export function generateRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const raw = encodeBase32(randomBytes(10)).slice(0, 16);
    return raw.match(/.{1,4}/g)?.join('-') ?? raw;
  });
}

export function normalizeRecoveryCode(code: string): string {
  return code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

export function encryptMfaSecret(secret: string): string {
  const key = mfaEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    'v1',
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');
}

export function decryptMfaSecret(payload: string): string {
  const [version, ivPart, tagPart, ciphertextPart] = payload.split('.');
  if (version !== 'v1' || !ivPart || !tagPart || !ciphertextPart) {
    throw new Error('Unsupported MFA secret payload.');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    mfaEncryptionKey(),
    Buffer.from(ivPart, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

function mfaEncryptionKey(): Buffer {
  const raw = process.env.TOTP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('TOTP_ENCRYPTION_KEY is required for MFA.');
  }

  if (/^[0-9a-f]{64}$/i.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  const decoded = Buffer.from(raw, 'base64');
  if (decoded.length !== 32) {
    throw new Error(
      'TOTP_ENCRYPTION_KEY must be 32 bytes encoded as hex or base64.',
    );
  }
  return decoded;
}

function constantTimeStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
