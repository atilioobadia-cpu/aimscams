import {
  constantTimeEqual,
  generateToken,
  hashSessionToken,
  normalizeEmail,
  readCookie,
} from './auth.crypto.js';

describe('auth crypto', () => {
  it('hashes session tokens deterministically without storing the token', () => {
    const token = 'session-token-value';
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).toHaveLength(64);
    expect(hashSessionToken(token)).not.toContain(token);
  });

  it('generates distinct URL-safe tokens', () => {
    const first = generateToken();
    const second = generateToken();
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('normalises email output', () => {
    expect(normalizeEmail('  Admin@Example.COM ')).toBe('admin@example.com');
  });

  it('compares tokens without leaking length differences', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
    expect(constantTimeEqual('abc', 'abcd')).toBe(false);
  });

  it('reads and decodes a named cookie', () => {
    expect(
      readCookie(
        'theme=light; aimscams_csrf=abc%3D123; other=x',
        'aimscams_csrf',
      ),
    ).toBe('abc=123');
    expect(readCookie('theme=light', 'aimscams_csrf')).toBeUndefined();
    expect(readCookie(undefined, 'aimscams_csrf')).toBeUndefined();
  });
});
