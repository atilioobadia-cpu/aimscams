import { describe, expect, it } from 'vitest';

import { fromMajor, percent, rate } from '../src/money.js';
import { addMonths, generateSchedule } from '../src/schedule.js';

const principal = fromMajor('1000000.00');

describe('addMonths', () => {
  it('clamps to the end of a shorter month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-03-31', 1)).toBe('2026-04-30');
  });

  it('crosses year boundaries', () => {
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
    expect(addMonths('2026-01-31', 13)).toBe('2027-02-28');
    expect(addMonths('2026-06-10', 0)).toBe('2026-06-10');
  });

  it('rejects malformed dates', () => {
    expect(() => addMonths('31/01/2026', 1)).toThrow(/invalid date/);
  });
});

describe('generateSchedule', () => {
  it('repays principal exactly, for every method', () => {
    for (const method of ['equal_instalment', 'equal_principal', 'flat'] as const) {
      const schedule = generateSchedule({
        principal,
        annualRate: percent(24),
        termMonths: 12,
        firstDueDate: '2026-02-01',
        method,
      });

      expect(schedule.rows).toHaveLength(12);
      expect(schedule.principal.minor).toBe(principal.minor);
      expect(schedule.rows.at(-1)?.closing.minor).toBe(0n);
    }
  });

  it('never produces a negative principal part or a balance that grows', () => {
    const schedule = generateSchedule({
      principal,
      annualRate: percent(24),
      termMonths: 18,
      firstDueDate: '2026-02-01',
      method: 'equal_instalment',
    });

    let previous = principal.minor;
    for (const row of schedule.rows) {
      expect(row.principal.minor >= 0n).toBe(true);
      expect(row.closing.minor).toBeLessThan(previous);
      expect(row.total.minor).toBe(row.principal.minor + row.interest.minor);
      previous = row.closing.minor;
    }
  });

  it('charges flat interest as principal x rate x years', () => {
    const schedule = generateSchedule({
      principal,
      annualRate: percent(24),
      termMonths: 12,
      firstDueDate: '2026-02-01',
      method: 'flat',
    });

    expect(schedule.interest.minor).toBe(24_000_000n);
  });

  it('tracks the outstanding balance for equal principal', () => {
    const schedule = generateSchedule({
      principal: fromMajor('1200000.00'),
      annualRate: percent(12),
      termMonths: 12,
      firstDueDate: '2026-02-01',
      method: 'equal_principal',
    });

    const parts = schedule.rows.map((row) => row.principal.minor);
    expect(parts.reduce((acc, part) => acc + part, 0n)).toBe(120_000_000n);
    expect(Math.max(...parts.map(Number)) - Math.min(...parts.map(Number))).toBeLessThanOrEqual(1);
    expect(schedule.interest.minor).toBeGreaterThan(0n);
  });

  it('handles a zero rate', () => {
    const schedule = generateSchedule({
      principal: fromMajor('1200.00'),
      annualRate: rate(0, 100),
      termMonths: 12,
      firstDueDate: '2026-02-01',
      method: 'equal_instalment',
    });

    expect(schedule.interest.minor).toBe(0n);
    expect(schedule.rows.every((row) => row.total.minor === 10_000n)).toBe(true);
    expect(schedule.principal.minor).toBe(120_000n);
  });

  it('rejects impossible terms', () => {
    expect(() =>
      generateSchedule({
        principal,
        annualRate: percent(24),
        termMonths: 0,
        firstDueDate: '2026-02-01',
        method: 'flat',
      }),
    ).toThrow(/termMonths/);

    expect(() =>
      generateSchedule({
        principal: fromMajor('0.00'),
        annualRate: percent(24),
        termMonths: 12,
        firstDueDate: '2026-02-01',
        method: 'flat',
      }),
    ).toThrow(/principal/);
  });
});
