/**
 * Money is integer minor units and never a float.
 *
 * TZS is quoted in whole shillings, but we keep two minor digits so that
 * rates, splits and allocations can be rounded to the cent and still
 * reconcile to the last unit. Every amount that reaches the ledger is an
 * integer here; conversion to a decimal only happens at the edge, for display.
 */

export const TZS = 'TZS' as const;
export type Currency = typeof TZS;

export interface Money {
  readonly minor: bigint;
  readonly currency: Currency;
}

/** A ratio kept as an exact fraction, so a rate is never a float. */
export interface Rate {
  readonly num: bigint;
  readonly den: bigint;
}

export function money(minor: bigint): Money {
  return { minor, currency: TZS };
}

/** Parses "1 234.50" style input. Accepts at most two decimal places. */
export function fromMajor(value: string | number): Money {
  const text = typeof value === 'number' ? value.toFixed(2) : value.trim();
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new Error(`invalid amount: ${text}`);
  }
  const negative = text.startsWith('-');
  const [whole = '0', fraction = ''] = text.replace('-', '').split('.');
  const minor = BigInt(whole) * 100n + BigInt(`${fraction}00`.slice(0, 2));
  return money(negative ? -minor : minor);
}

export function toMajor(value: Money): string {
  const negative = value.minor < 0n;
  const absolute = negative ? -value.minor : value.minor;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}

export function zero(): Money {
  return money(0n);
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.minor + b.minor);
}

export function sub(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.minor - b.minor);
}

export function neg(a: Money): Money {
  return money(-a.minor);
}

export function abs(a: Money): Money {
  return money(a.minor < 0n ? -a.minor : a.minor);
}

export function isZero(a: Money): boolean {
  return a.minor === 0n;
}

export function isNegative(a: Money): boolean {
  return a.minor < 0n;
}

export function cmp(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  if (a.minor < b.minor) return -1;
  if (a.minor > b.minor) return 1;
  return 0;
}

export function sum(values: readonly Money[]): Money {
  return values.reduce<Money>((acc, value) => add(acc, value), money(0n));
}

export function rate(num: bigint | number, den: bigint | number = 100n): Rate {
  const numerator = typeof num === 'bigint' ? num : BigInt(num);
  const denominator = typeof den === 'bigint' ? den : BigInt(den);
  if (denominator === 0n) throw new Error('rate denominator must not be zero');
  if (denominator < 0n) throw new Error('rate denominator must be positive');
  return { num: numerator, den: denominator };
}

/** 5 percent -> 5/100. */
export function percent(value: bigint | number): Rate {
  return rate(value, 100n);
}

/** Integer division, half away from zero. The only rounding rule in the system. */
export function divRound(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error('division by zero');
  const negative = numerator < 0n !== denominator < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  let quotient = n / d;
  if ((n % d) * 2n >= d) quotient += 1n;
  return negative ? -quotient : quotient;
}

export function applyRate(value: Money, multiplier: Rate): Money {
  if (multiplier.den <= 0n) throw new Error('rate denominator must be positive');
  return money(divRound(value.minor * multiplier.num, multiplier.den));
}

/**
 * Splits money by weights with no loss and no gain: the parts always sum to
 * the input. Remainders go to the largest fractional parts first, then by
 * weight order, which keeps the split stable across runs.
 */
export function allocateBy(total: Money, weights: readonly bigint[]): Money[] {
  if (weights.length === 0) throw new Error('weights must not be empty');
  if (weights.some((weight) => weight < 0n)) {
    throw new Error('weights must be non-negative');
  }
  const weightSum = weights.reduce((acc, weight) => acc + weight, 0n);
  if (weightSum === 0n) throw new Error('weights must not all be zero');

  const negative = total.minor < 0n;
  const absolute = negative ? -total.minor : total.minor;

  const parts = weights.map((weight) => (absolute * weight) / weightSum);
  const remainders = weights.map((weight, index) => ({
    index,
    remainder: (absolute * weight) % weightSum,
  }));
  remainders.sort((a, b) =>
    a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
  );

  let left = absolute - parts.reduce((acc, part) => acc + part, 0n);
  for (const { index } of remainders) {
    if (left === 0n) break;
    parts[index] = (parts[index] ?? 0n) + 1n;
    left -= 1n;
  }

  return parts.map((part) => money(negative ? -part : part));
}
