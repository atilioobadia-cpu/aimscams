const decimal = new Intl.NumberFormat("en-TZ", {
  maximumFractionDigits: 0,
});

const compactDecimal = new Intl.NumberFormat("en-TZ", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

function toBigInt(value: string | bigint): bigint {
  return typeof value === "bigint" ? value : BigInt(value);
}

/** Money is always integer minor units. Display divides by 100 with integer arithmetic. */
export function formatMinorUnits(value: string | bigint): string {
  return decimal.format(toBigInt(value) / 100n);
}

export function formatTzs(value: string | bigint): string {
  return `TZS ${formatMinorUnits(value)}`;
}

/**
 * Ledger money keeps both decimals. Integer arithmetic builds the cents, so a
 * TZS 2,500,000.05 posting never turns into a float on the way to the screen.
 */
export function formatMinorUnitsExact(value: string | bigint): string {
  const minor = toBigInt(value);
  const negative = minor < 0n;
  const absolute = negative ? -minor : minor;
  const whole = absolute / 100n;
  const cents = absolute % 100n;
  return `${negative ? "N/A" : ""}${decimal.format(whole)}.${cents.toString().padStart(2, "0")}`;
}

export function formatTzsExact(value: string | bigint): string {
  return `TZS ${formatMinorUnitsExact(value)}`;
}

export function formatInteger(value: string | number): string {
  return decimal.format(typeof value === "bigint" ? value : BigInt(value));
}

/**
 * Compact TZS label for chart axes and values. Rounds half up in minor units,
 * never through a JavaScript number, so a 47.5M bar stays exactly 47.5M.
 */
export function formatCompactTzs(value: string | bigint): string {
  const whole = toBigInt(value) / 100n;
  const tenthsOfMillion = (whole * 10n + 500_000n) / 1_000_000n;
  const millions = tenthsOfMillion / 10n;
  const tenths = tenthsOfMillion % 10n;

  return tenths === 0n ? `${millions}M` : `${millions}.${tenths}M`;
}

export function formatAxisTzs(value: string | bigint): string {
  const millions = toBigInt(value) / 100n / 1_000_000n;
  return `TZS ${millions}M`;
}

export function subtractMinor(left: string | bigint, right: string | bigint): string {
  return (toBigInt(left) - toBigInt(right)).toString();
}

/** Percentages are presentation values only; money never becomes a JS number. */
export function sharePercent(value: string | bigint, total: string | bigint): number {
  const numerator = toBigInt(value) * 10_000n;
  const denominator = toBigInt(total);
  return Number(numerator / denominator) / 100;
}

export function formatPercent(value: number): string {
  return `${compactDecimal.format(value)}%`;
}
