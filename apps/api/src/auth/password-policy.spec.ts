import {
  hashPassword,
  passwordPolicyError,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from './password-policy.js';

describe('passwordPolicyError', () => {
  const valid = 'Aimscams#2026';

  it('accepts a password that meets the policy', () => {
    expect(passwordPolicyError(valid, 'admin@aimscams.local')).toBeNull();
  });

  it('enforces length, character classes and symbol rules', () => {
    expect(passwordPolicyError('short', 'admin@aimscams.local')).toBe(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    );
    expect(passwordPolicyError(`Aa1!${'x'.repeat(PASSWORD_MAX_LENGTH)}`)).toBe(
      `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`,
    );
    expect(passwordPolicyError('AIMSCAMS#2026X')).toBe(
      'Password must include a lowercase letter.',
    );
    expect(passwordPolicyError('aimscams#2026x')).toBe(
      'Password must include an uppercase letter.',
    );
    expect(passwordPolicyError('Aimscams#xxxxx')).toBe(
      'Password must include a number.',
    );
    expect(passwordPolicyError('Aimscams20260')).toBe(
      'Password must include a symbol.',
    );
  });

  it('rejects the email local part', () => {
    expect(
      passwordPolicyError('Admin#2026secure', 'admin@aimscams.local'),
    ).toBe('Password must not contain your email address.');
  });
});

describe('hashPassword', () => {
  it('produces a verifiable Argon2id hash', async () => {
    const { verify } = await import('@node-rs/argon2');
    const encoded = await hashPassword('Aimscams#2026');
    expect(encoded).toMatch(/^\$argon2id\$/);
    await expect(verify(encoded, 'Aimscams#2026')).resolves.toBe(true);
    await expect(verify(encoded, 'wrong-password')).resolves.toBe(false);
  });
});
