import { hash } from '@node-rs/argon2';

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 200;

// Argon2id is this package's default algorithm.
const PASSWORD_HASH_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function passwordPolicyError(
  password: string,
  email?: string,
): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include a lowercase letter.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include an uppercase letter.';
  }
  if (!/\d/.test(password)) {
    return 'Password must include a number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include a symbol.';
  }

  const localPart = email?.split('@')[0]?.toLowerCase();
  if (
    localPart &&
    localPart.length >= 3 &&
    password.toLowerCase().includes(localPart)
  ) {
    return 'Password must not contain your email address.';
  }

  return null;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, PASSWORD_HASH_OPTIONS);
}
