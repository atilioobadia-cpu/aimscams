import { describe, expect, it } from 'vitest';

import { bucketFor, computeArrears, daysBetween } from '../src/arrears.js';
import { fromMajor } from '../src/money.js';

describe('daysBetween', () => {
  it('counts whole days between ISO dates', () => {
    expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30);
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0);
    expect(daysBetween('2026-03-01', '2026-02-01')).toBe(-28);
  });

  it('rejects malformed dates', () => {
    expect(() => daysBetween('2026-1-1', '2026-02-01')).toThrow(/invalid date/);
  });
});

describe('bucketFor', () => {
  it('maps days to the statutory-shaped buckets', () => {
    expect(bucketFor(0)).toBe('current');
    expect(bucketFor(-5)).toBe('current');
    expect(bucketFor(1)).toBe('days1to30');
    expect(bucketFor(30)).toBe('days1to30');
    expect(bucketFor(31)).toBe('days31to60');
    expect(bucketFor(60)).toBe('days31to60');
    expect(bucketFor(61)).toBe('days61to90');
    expect(bucketFor(90)).toBe('days61to90');
    expect(bucketFor(91)).toBe('days91to180');
    expect(bucketFor(180)).toBe('days91to180');
    expect(bucketFor(181)).toBe('days181plus');
  });
});

describe('computeArrears', () => {
  it('ages each unpaid instalment into its own bucket', () => {
    const result = computeArrears(
      [
        { dueDate: '2026-01-01', due: fromMajor('100.00'), paid: fromMajor('0.00') },
        { dueDate: '2026-02-15', due: fromMajor('200.00'), paid: fromMajor('50.00') },
        { dueDate: '2026-03-01', due: fromMajor('300.00'), paid: fromMajor('300.00') },
      ],
      '2026-03-15',
    );

    expect(result.daysPastDue).toBe(73);
    expect(result.oldestDueDate).toBe('2026-01-01');
    expect(result.overdue.minor).toBe(25_000n);
    expect(result.buckets.days61to90.minor).toBe(10_000n);
    expect(result.buckets.days1to30.minor).toBe(15_000n);
    expect(result.buckets.days181plus.minor).toBe(0n);
  });

  it('returns an empty ageing for a fully paid schedule', () => {
    const result = computeArrears(
      [{ dueDate: '2026-01-01', due: fromMajor('100.00'), paid: fromMajor('100.00') }],
      '2026-03-15',
    );

    expect(result.daysPastDue).toBe(0);
    expect(result.overdue.minor).toBe(0n);
    expect(result.oldestDueDate).toBeNull();
  });

  it('does not treat a not-yet-due instalment as overdue days', () => {
    const result = computeArrears(
      [{ dueDate: '2026-04-01', due: fromMajor('100.00'), paid: fromMajor('0.00') }],
      '2026-03-15',
    );

    expect(result.daysPastDue).toBe(0);
    expect(result.buckets.current.minor).toBe(10_000n);
  });

  it('keeps the buckets and the total in agreement', () => {
    const result = computeArrears(
      [
        { dueDate: '2025-06-01', due: fromMajor('500.00'), paid: fromMajor('0.00') },
        { dueDate: '2026-01-01', due: fromMajor('500.00'), paid: fromMajor('100.00') },
      ],
      '2026-03-15',
    );

    const buckets = Object.values(result.buckets).reduce((acc, money) => acc + money.minor, 0n);
    expect(buckets).toBe(result.overdue.minor);
  });
});
