import { describe, expect, it } from 'vitest';

import { allocatePayment, DEFAULT_ALLOCATION_ORDER, dues } from '../src/allocation.js';
import { fromMajor } from '../src/money.js';

const owed = dues({
  penalty: fromMajor('100.00'),
  charges: fromMajor('50.00'),
  interest: fromMajor('300.00'),
  principal: fromMajor('1000.00'),
});

describe('allocatePayment', () => {
  it('follows the observed order: penalty, charges, interest, principal', () => {
    const result = allocatePayment(fromMajor('1000.00'), owed);

    expect(result.applied.penalty.minor).toBe(10_000n);
    expect(result.applied.charges.minor).toBe(5_000n);
    expect(result.applied.interest.minor).toBe(30_000n);
    expect(result.applied.principal.minor).toBe(55_000n);
    expect(result.remaining.penalty.minor).toBe(0n);
    expect(result.remaining.charges.minor).toBe(0n);
    expect(result.remaining.interest.minor).toBe(0n);
    expect(result.remaining.principal.minor).toBe(45_000n);
    expect(result.overpayment.minor).toBe(0n);
  });

  it('stops inside the first component when the payment is small', () => {
    const result = allocatePayment(fromMajor('75.00'), owed);

    expect(result.applied.penalty.minor).toBe(7_500n);
    expect(result.applied.charges.minor).toBe(0n);
    expect(result.remaining.penalty.minor).toBe(2_500n);
    expect(result.overpayment.minor).toBe(0n);
  });

  it('treats everything above the total due as overpayment, never as principal', () => {
    const result = allocatePayment(fromMajor('2000.00'), owed);

    expect(result.remaining.principal.minor).toBe(0n);
    expect(result.overpayment.minor).toBe(55_000n);
  });

  it('conserves the payment: applied plus overpayment equals what came in', () => {
    for (const amount of ['0.01', '75.00', '999.99', '1450.00', '5000.00']) {
      const payment = fromMajor(amount);
      const result = allocatePayment(payment, owed);
      const applied =
        result.applied.penalty.minor +
        result.applied.charges.minor +
        result.applied.interest.minor +
        result.applied.principal.minor;

      expect(applied + result.overpayment.minor).toBe(payment.minor);
      expect(applied).toBeLessThanOrEqual(payment.minor);
    }
  });

  it('accepts a different product order without changing the rules', () => {
    const result = allocatePayment(fromMajor('1000.00'), owed, [
      'principal',
      'interest',
      'penalty',
      'charges',
    ]);

    expect(result.applied.principal.minor).toBe(100_000n);
    expect(result.applied.interest.minor).toBe(0n);
    expect(result.remaining.penalty.minor).toBe(10_000n);
  });

  it('handles a zero payment', () => {
    const result = allocatePayment(fromMajor('0.00'), owed);
    expect(result.overpayment.minor).toBe(0n);
    expect(result.remaining.principal.minor).toBe(owed.principal.minor);
  });

  it('rejects negative money and malformed orders', () => {
    expect(() => allocatePayment(fromMajor('-1.00'), owed)).toThrow(/negative/);
    expect(() => allocatePayment(fromMajor('1.00'), owed, ['principal'])).toThrow(/every component/);
    expect(() =>
      allocatePayment(fromMajor('1.00'), owed, [
        'principal',
        'principal',
        'interest',
        'penalty',
      ]),
    ).toThrow(/duplicate/);
  });

  it('exposes the default order as a value the product can override', () => {
    expect(DEFAULT_ALLOCATION_ORDER).toEqual(['penalty', 'charges', 'interest', 'principal']);
  });
});
