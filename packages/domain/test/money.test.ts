import { describe, expect, it } from 'vitest';

import {
  add,
  allocateBy,
  applyRate,
  cmp,
  divRound,
  fromMajor,
  money,
  percent,
  sub,
  sum,
  toMajor,
  zero,
} from '../src/money.js';

describe('money', () => {
  it('parses major units into exact minor units', () => {
    expect(fromMajor('1000.50').minor).toBe(100_050n);
    expect(fromMajor('0.05').minor).toBe(5n);
    expect(fromMajor('-12.34').minor).toBe(-1_234n);
    expect(fromMajor(7).minor).toBe(700n);
  });

  it('round-trips back to major units', () => {
    expect(toMajor(fromMajor('0.05'))).toBe('0.05');
    expect(toMajor(fromMajor('1234567.89'))).toBe('1234567.89');
    expect(toMajor(money(-5n))).toBe('-0.05');
  });

  it('rejects more than two decimal places', () => {
    expect(() => fromMajor('1.234')).toThrow(/invalid amount/);
  });

  it('adds, subtracts and sums without drift', () => {
    expect(add(fromMajor('0.10'), fromMajor('0.20')).minor).toBe(30n);
    expect(sub(fromMajor('1.00'), fromMajor('0.99')).minor).toBe(1n);
    expect(sum([fromMajor('1.01'), fromMajor('2.02'), fromMajor('3.03')]).minor).toBe(606n);
  });

  it('compares', () => {
    expect(cmp(fromMajor('1.00'), fromMajor('2.00'))).toBe(-1);
    expect(cmp(fromMajor('2.00'), fromMajor('2.00'))).toBe(0);
    expect(cmp(fromMajor('3.00'), fromMajor('2.00'))).toBe(1);
  });

  it('rounds half away from zero, in both directions', () => {
    expect(divRound(5n, 2n)).toBe(3n);
    expect(divRound(-5n, 2n)).toBe(-3n);
    expect(divRound(4n, 2n)).toBe(2n);
    expect(divRound(1n, 3n)).toBe(0n);
  });

  it('applies a percentage exactly', () => {
    expect(applyRate(fromMajor('1000.00'), percent(5)).minor).toBe(5_000n);
    expect(applyRate(fromMajor('1000.00'), percent(24)).minor).toBe(24_000n);
    expect(() => applyRate(zero(), { num: 1n, den: 0n })).toThrow(/denominator/);
  });

  it('splits money with no loss and no gain', () => {
    const parts = allocateBy(money(100n), [1n, 1n, 1n]);
    expect(parts.map((part) => part.minor)).toEqual([34n, 33n, 33n]);
    expect(sum(parts).minor).toBe(100n);

    const weighted = allocateBy(money(100n), [2n, 1n]);
    expect(weighted.map((part) => part.minor)).toEqual([67n, 33n]);
    expect(sum(weighted).minor).toBe(100n);
  });

  it('splits evenly when the amount divides cleanly', () => {
    const parts = allocateBy(fromMajor('900.00'), [1n, 1n, 1n]);
    expect(parts.every((part) => part.minor === 30_000n)).toBe(true);
  });

  it('rejects unusable weights', () => {
    expect(() => allocateBy(money(100n), [])).toThrow(/empty/);
    expect(() => allocateBy(money(100n), [0n, 0n])).toThrow(/zero/);
    expect(() => allocateBy(money(100n), [1n, -1n])).toThrow(/negative/);
  });
});
