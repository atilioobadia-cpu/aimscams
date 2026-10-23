/**
 * Payment allocation.
 *
 * The order is product configuration, not a constant: the observed default is
 * penalty, then charges, then interest, then principal (docs/03-flows.md §7).
 * Nothing here decides the order — the caller supplies it from the product.
 *
 * Anything left after every due is covered is an overpayment. It is never
 * applied to principal: it posts to the 2004 Overpayments liability and is
 * refunded or offset explicitly.
 */

import { type Money, money, zero } from './money.js';

export const COMPONENTS = ['penalty', 'charges', 'interest', 'principal'] as const;
export type Component = (typeof COMPONENTS)[number];
export type Dues = Readonly<Record<Component, Money>>;

export interface AllocationResult {
  /** Amount taken from the payment for each component. */
  applied: Dues;
  /** Amount that exceeded every outstanding due. */
  overpayment: Money;
  /** What is still owed per component after the payment. */
  remaining: Dues;
}

export const DEFAULT_ALLOCATION_ORDER: readonly Component[] = COMPONENTS;

export function zeroDues(): Dues {
  return { penalty: zero(), charges: zero(), interest: zero(), principal: zero() };
}

export function dues(values: Partial<Dues> = {}): Dues {
  const base = zeroDues();
  return {
    penalty: values.penalty ?? base.penalty,
    charges: values.charges ?? base.charges,
    interest: values.interest ?? base.interest,
    principal: values.principal ?? base.principal,
  };
}

export function allocatePayment(
  payment: Money,
  outstanding: Dues,
  order: readonly Component[] = DEFAULT_ALLOCATION_ORDER,
): AllocationResult {
  if (payment.minor < 0n) throw new Error('payment must not be negative');
  assertValidOrder(order);

  for (const component of COMPONENTS) {
    if (outstanding[component].minor < 0n) {
      throw new Error(`outstanding ${component} must not be negative`);
    }
  }

  const applied: Record<Component, Money> = { ...zeroDues() };
  const remaining: Record<Component, Money> = { ...outstanding };

  let left = payment.minor;
  for (const component of order) {
    const owed = remaining[component].minor;
    const take = left < owed ? left : owed;
    applied[component] = money(take);
    remaining[component] = money(owed - take);
    left -= take;
  }

  return { applied, overpayment: money(left), remaining };
}

function assertValidOrder(order: readonly Component[]): void {
  if (order.length !== COMPONENTS.length) {
    throw new Error('allocation order must list every component exactly once');
  }
  const seen = new Set<Component>();
  for (const component of order) {
    if (!COMPONENTS.includes(component)) {
      throw new Error(`unknown allocation component: ${String(component)}`);
    }
    if (seen.has(component)) {
      throw new Error(`duplicate allocation component: ${component}`);
    }
    seen.add(component);
  }
}
