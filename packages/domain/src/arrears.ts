/**
 * Arrears ageing.
 *
 * Deliberately stops at buckets. Mapping buckets to provisioning rates and to
 * a regulatory classification (Pass, Special Mention, Substandard, Doubtful,
 * Loss) is policy data supplied per dialect — it is not a domain constant and
 * must not be guessed here (D-015, O-002).
 */

import { type Money, add, money, zero } from './money.js';

export const AGING_BUCKETS = [
  'current',
  'days1to30',
  'days31to60',
  'days61to90',
  'days91to180',
  'days181plus',
] as const;

export type AgingBucket = (typeof AGING_BUCKETS)[number];

export interface ArrearsRow {
  dueDate: string;
  due: Money;
  paid: Money;
}

export interface ArrearsResult {
  /** Days since the oldest unpaid, overdue instalment. Zero when nothing is overdue. */
  daysPastDue: number;
  overdue: Money;
  buckets: Readonly<Record<AgingBucket, Money>>;
  oldestDueDate: string | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

export function daysBetween(fromIso: string, toIso: string): number {
  if (!ISO_DATE.test(fromIso)) throw new Error(`invalid date: ${fromIso}`);
  if (!ISO_DATE.test(toIso)) throw new Error(`invalid date: ${toIso}`);
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) throw new Error('invalid date');
  return Math.floor((to - from) / DAY_MS);
}

export function bucketFor(daysPastDue: number): AgingBucket {
  if (daysPastDue <= 0) return 'current';
  if (daysPastDue <= 30) return 'days1to30';
  if (daysPastDue <= 60) return 'days31to60';
  if (daysPastDue <= 90) return 'days61to90';
  if (daysPastDue <= 180) return 'days91to180';
  return 'days181plus';
}

export function computeArrears(rows: readonly ArrearsRow[], asOf: string): ArrearsResult {
  if (!ISO_DATE.test(asOf)) throw new Error(`invalid date: ${asOf}`);

  const buckets: Record<AgingBucket, Money> = {
    current: zero(),
    days1to30: zero(),
    days31to60: zero(),
    days61to90: zero(),
    days91to180: zero(),
    days181plus: zero(),
  };

  let overdue = zero();
  let daysPastDue = 0;
  let oldestDueDate: string | null = null;

  for (const row of rows) {
    const outstanding = row.due.minor - row.paid.minor;
    if (outstanding <= 0n) continue;

    const days = daysBetween(row.dueDate, asOf);
    const bucket = bucketFor(days);
    buckets[bucket] = add(buckets[bucket], money(outstanding));
    overdue = add(overdue, money(outstanding));

    if (days > 0 && days > daysPastDue) {
      daysPastDue = days;
      oldestDueDate = row.dueDate;
    }
  }

  return { daysPastDue, overdue, buckets, oldestDueDate };
}
