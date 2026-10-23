/**
 * Repayment schedules. Three methods, all of which must reconcile exactly:
 * the principal parts always sum to the amount disbursed, and the final
 * closing balance is always zero.
 *
 * Interest is computed from integer amounts with an exact rational monthly
 * rate. The only floating-point step is the annuity factor used to derive the
 * level instalment; it is rounded once, and every row after that is derived
 * exactly, with the final row absorbing the rounding difference.
 */

import {
  type Money,
  type Rate,
  add,
  allocateBy,
  applyRate,
  money,
  rate,
  zero,
} from './money.js';

export type ScheduleMethod = 'equal_instalment' | 'equal_principal' | 'flat';

export interface ScheduleInput {
  /** Amount disbursed. Must be positive. */
  principal: Money;
  /** Annual nominal rate, e.g. rate(24, 100) for 24 percent. */
  annualRate: Rate;
  termMonths: number;
  /** Due date of the first instalment, ISO yyyy-mm-dd. */
  firstDueDate: string;
  method: ScheduleMethod;
}

export interface ScheduleRow {
  no: number;
  dueDate: string;
  opening: Money;
  principal: Money;
  interest: Money;
  total: Money;
  closing: Money;
}

export interface Schedule {
  method: ScheduleMethod;
  rows: ScheduleRow[];
  principal: Money;
  interest: Money;
  total: Money;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Adds calendar months, clamping the day to the length of the target month. */
export function addMonths(isoDate: string, months: number): string {
  if (!ISO_DATE.test(isoDate)) throw new Error(`invalid date: ${isoDate}`);
  const [yearText = '1970', monthText = '1', dayText = '1'] = isoDate.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1 + months;
  const day = Number(dayText);

  const shiftedYear = year + Math.floor(monthIndex / 12);
  const shiftedMonth = ((monthIndex % 12) + 12) % 12;
  const lastDayOfMonth = new Date(Date.UTC(shiftedYear, shiftedMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfMonth);

  return [
    String(shiftedYear).padStart(4, '0'),
    String(shiftedMonth + 1).padStart(2, '0'),
    String(clampedDay).padStart(2, '0'),
  ].join('-');
}

export function generateSchedule(input: ScheduleInput): Schedule {
  assertValid(input);
  const { principal, annualRate, termMonths, firstDueDate, method } = input;

  const monthlyRate = rate(annualRate.num, annualRate.den * 12n);
  const equalWeights = Array.from({ length: termMonths }, () => 1n);

  const principalParts =
    method === 'equal_instalment' ? null : allocateBy(principal, equalWeights);

  const flatInterest = method === 'flat'
    ? allocateBy(
        applyRate(
          principal,
          rate(annualRate.num * BigInt(termMonths), annualRate.den * 12n),
        ),
        equalWeights,
      )
    : null;

  const instalment =
    method === 'equal_instalment' ? instalmentAmount(principal, monthlyRate, termMonths) : 0n;

  const rows: ScheduleRow[] = [];
  let opening = principal;
  let principalLeft = principal.minor;

  for (let index = 0; index < termMonths; index += 1) {
    const isLast = index === termMonths - 1;
    const interest = flatInterest
      ? (flatInterest[index] ?? zero())
      : applyRate(opening, monthlyRate);

    let principalPart: bigint;
    if (isLast) {
      principalPart = principalLeft;
    } else if (principalParts) {
      principalPart = (principalParts[index] ?? zero()).minor;
    } else {
      principalPart = instalment - interest.minor;
    }

    if (principalPart < 0n) principalPart = 0n;
    if (principalPart > principalLeft) principalPart = principalLeft;

    const rowPrincipal = money(principalPart);
    const closing = money(opening.minor - principalPart);
    rows.push({
      no: index + 1,
      dueDate: addMonths(firstDueDate, index),
      opening,
      principal: rowPrincipal,
      interest,
      total: add(rowPrincipal, interest),
      closing,
    });

    opening = closing;
    principalLeft -= principalPart;
  }

  const principalTotal = rows.reduce((acc, row) => add(acc, row.principal), zero());
  const interestTotal = rows.reduce((acc, row) => add(acc, row.interest), zero());

  return {
    method,
    rows,
    principal: principalTotal,
    interest: interestTotal,
    total: add(principalTotal, interestTotal),
  };
}

function instalmentAmount(principal: Money, monthlyRate: Rate, termMonths: number): bigint {
  const principalMinor = Number(principal.minor);
  const monthly = Number(monthlyRate.num) / Number(monthlyRate.den);

  if (monthly === 0) {
    return BigInt(Math.max(1, Math.round(principalMinor / termMonths)));
  }

  const factor = 1 - Math.pow(1 + monthly, -termMonths);
  if (!Number.isFinite(factor) || factor <= 0) {
    throw new Error('cannot compute a level instalment for these terms');
  }

  return BigInt(Math.max(1, Math.round((principalMinor * monthly) / factor)));
}

function assertValid(input: ScheduleInput): void {
  const { principal, annualRate, termMonths, firstDueDate } = input;
  if (!Number.isInteger(termMonths) || termMonths <= 0) {
    throw new Error('termMonths must be a positive integer');
  }
  if (principal.minor <= 0n) throw new Error('principal must be positive');
  if (annualRate.num < 0n) throw new Error('annualRate must not be negative');
  if (!ISO_DATE.test(firstDueDate)) throw new Error(`invalid date: ${firstDueDate}`);
}
