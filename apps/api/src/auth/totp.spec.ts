import { randomBytes } from 'node:crypto';
import {
  decodeBase32,
  decryptMfaSecret,
  encodeBase32,
  encryptMfaSecret,
  generateRecoveryCodes,
  generateTotpCode,
  generateTotpSecret,
  normalizeRecoveryCode,
  totpUri,
  verifyTotp,
} from './totp.js';

const RFC_SECRET = encodeBase32(Buffer.from('12345678901234567890', 'utf8'));

describe('TOTP', () => {
  const previousKey = process.env.TOTP_ENCRYPTION_KEY;

  beforeAll(() => {
    process.env.TOTP_ENCRYPTION_KEY = randomBytes(32).toString('base64');
  });

  afterAll(() => {
    if (previousKey === undefined) {
      delete process.env.TOTP_ENCRYPTION_KEY;
    } else {
      process.env.TOTP_ENCRYPTION_KEY = previousKey;
    }
  });

  it('matches the RFC 6238 SHA-1 test vectors', () => {
    const vectors: Array<[number, number, string]> = [
      [59, 1, '94287082'],
      [1_111_111_109, 37_037_036, '07081804'],
      [1_111_111_111, 37_037_037, '14050471'],
      [1_234_567_890, 41_152_263, '89005924'],
      [2_000_000_000, 66_666_666, '69279037'],
      [20_000_000_000, 666_666_666, '65353130'],
    ];

    for (const [, counter, expected] of vectors) {
      expect(generateTotpCode(RFC_SECRET, counter, 8)).toBe(expected);
    }
  });

  it('round-trips base32 and rejects invalid alphabet characters', () => {
    const source = randomBytes(20);
    const encoded = encodeBase32(source);
    expect(decodeBase32(encoded)).toEqual(source);
    expect(() => decodeBase32('ABC1')).toThrow('Invalid base32 secret.');
  });

  it('accepts the current and adjacent time steps, not distant ones', () => {
    const now = 59_000;
    expect(
      verifyTotp(RFC_SECRET, generateTotpCode(RFC_SECRET, 1), { now }),
    ).toEqual({
      counter: 1,
    });
    expect(
      verifyTotp(RFC_SECRET, generateTotpCode(RFC_SECRET, 2), { now }),
    ).toEqual({
      counter: 2,
    });
    expect(
      verifyTotp(RFC_SECRET, generateTotpCode(RFC_SECRET, 4), { now }),
    ).toBeNull();
  });

  it('rejects tokens that are not exactly six digits', () => {
    expect(verifyTotp(RFC_SECRET, '12345', { now: 59_000 })).toBeNull();
    expect(verifyTotp(RFC_SECRET, 'abcdef', { now: 59_000 })).toBeNull();
  });

  it('generates a 20-byte secret and a usable otpauth URI', () => {
    const secret = generateTotpSecret();
    expect(decodeBase32(secret)).toHaveLength(20);
    const uri = totpUri({ secret, email: 'admin@aimscams.local' });
    expect(uri).toContain('otpauth://totp/AIMSCAMS%3Aadmin%40aimscams.local');
    expect(uri).toContain('issuer=AIMSCAMS');
    expect(uri).toContain('period=30');
  });

  it('encrypts secrets with authenticated encryption', () => {
    const secret = generateTotpSecret();
    const payload = encryptMfaSecret(secret);
    expect(payload).not.toContain(secret);
    expect(payload.startsWith('v1.')).toBe(true);
    expect(decryptMfaSecret(payload)).toBe(secret);

    const parts = payload.split('.');
    const ciphertext = parts[3];
    const midpoint = Math.floor(ciphertext.length / 2);
    parts[3] = `${ciphertext.slice(0, midpoint)}${
      ciphertext[midpoint] === 'A' ? 'B' : 'A'
    }${ciphertext.slice(midpoint + 1)}`;
    expect(() => decryptMfaSecret(parts.join('.'))).toThrow();
  });

  it('generates distinct, formatted recovery codes that normalise for hashing', () => {
    const codes = generateRecoveryCodes(10);
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) {
      expect(code).toMatch(/^[A-Z2-7]{4}-[A-Z2-7]{4}-[A-Z2-7]{4}-[A-Z2-7]{4}$/);
      expect(normalizeRecoveryCode(code)).toMatch(/^[A-Z2-7]{16}$/);
    }
    expect(normalizeRecoveryCode(' abcd-efgh ')).toBe('ABCDEFGH');
  });
});
