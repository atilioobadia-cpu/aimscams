import { describe, expect, it, vi } from 'vitest';

import {
  pumpOutbox,
  type OutboxEvent,
  type OutboxPublisher,
  type OutboxStore,
} from '../src/outbox';

function event(overrides: Partial<OutboxEvent> = {}): OutboxEvent {
  return {
    id: '9b1d0f8e-0000-4000-8000-000000000001',
    organisationId: 'org-1',
    eventType: 'journal.posted',
    aggregateType: 'journal_entry',
    aggregateId: 'entry-1',
    payload: { entryId: 'entry-1' },
    idempotencyKey: 'journal.posted:entry-1',
    attempts: 1,
    ...overrides,
  };
}

function harness(events: Record<string, OutboxEvent[]>, publishError?: Error) {
  const remaining = new Map(Object.entries(events));
  const store: OutboxStore = {
    tenants: vi.fn(async () => [...remaining.keys()]),
    claim: vi.fn(async (organisationId: string, limit: number, leaseSeconds: number) => {
      expect(limit).toBeGreaterThan(0);
      expect(leaseSeconds).toBeGreaterThanOrEqual(30);
      const queue = remaining.get(organisationId) ?? [];
      const claimed = queue.splice(0, limit);
      return claimed;
    }),
    processed: vi.fn(async () => {}),
    retry: vi.fn(async () => {}),
    dead: vi.fn(async () => {}),
  };
  const publisher: OutboxPublisher = {
    publish: vi.fn(async () => {
      if (publishError) throw publishError;
    }),
    deadLetter: vi.fn(async () => {}),
  };
  return { store, publisher };
}

describe('pumpOutbox', () => {
  it('publishes a committed event and marks it processed', async () => {
    const first = event();
    const { store, publisher } = harness({ 'org-1': [first] });

    const summary = await pumpOutbox({ store, publisher });

    expect(summary).toEqual({ claimed: 1, published: 1, retried: 0, dead: 0 });
    expect(publisher.publish).toHaveBeenCalledWith(first);
    expect(store.processed).toHaveBeenCalledWith(first);
    expect(store.retry).not.toHaveBeenCalled();
    expect(store.dead).not.toHaveBeenCalled();
  });

  it('drains every tenant in the same pass', async () => {
    const { store, publisher } = harness({
      'org-1': [event({ id: 'a' }), event({ id: 'b' })],
      'org-2': [event({ id: 'c', organisationId: 'org-2' })],
    });

    const summary = await pumpOutbox({ store, publisher, batchSize: 10 });

    expect(summary.claimed).toBe(3);
    expect(summary.published).toBe(3);
    expect(store.claim).toHaveBeenCalledWith('org-1', 10, 60);
    expect(store.claim).toHaveBeenCalledWith('org-2', 10, 60);
  });

  it('backs off a failed publish instead of dropping the event', async () => {
    const first = event({ attempts: 2 });
    const { store, publisher } = harness({ 'org-1': [first] }, new Error('redis unavailable'));

    const before = Date.now();
    const summary = await pumpOutbox({ store, publisher });
    const after = Date.now();

    expect(summary).toEqual({ claimed: 1, published: 0, retried: 1, dead: 0 });
    expect(store.processed).not.toHaveBeenCalled();
    expect(store.dead).not.toHaveBeenCalled();
    expect(store.retry).toHaveBeenCalledTimes(1);

    const [, reason, availableAt] = vi.mocked(store.retry).mock.calls[0]!;
    expect(reason).toBe('redis unavailable');
    expect(availableAt.getTime()).toBeGreaterThanOrEqual(before + 2_000);
    expect(availableAt.getTime()).toBeLessThanOrEqual(after + 2_000);
  });

  it('buries an event on its final attempt and copies it to the dead-letter queue', async () => {
    const first = event({ attempts: 5 });
    const { store, publisher } = harness({ 'org-1': [first] }, new Error('redis unavailable'));

    const summary = await pumpOutbox({ store, publisher });

    expect(summary).toEqual({ claimed: 1, published: 0, retried: 0, dead: 1 });
    expect(store.retry).not.toHaveBeenCalled();
    expect(store.dead).toHaveBeenCalledWith(first, 'redis unavailable');
    expect(publisher.deadLetter).toHaveBeenCalledWith(first, 'redis unavailable');
  });

  it('keeps the outbox row dead when the dead-letter copy itself fails', async () => {
    const first = event({ attempts: 5 });
    const { store, publisher } = harness({ 'org-1': [first] }, new Error('redis unavailable'));
    vi.mocked(publisher.deadLetter).mockRejectedValueOnce(new Error('redis still down'));
    const error = vi.fn();

    const summary = await pumpOutbox({
      store,
      publisher,
      logger: { info: vi.fn(), warn: vi.fn(), error },
    });

    expect(summary.dead).toBe(1);
    expect(store.dead).toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('outbox.dead-letter-failed', expect.any(Object));
  });

  it('does nothing when no event is due', async () => {
    const { store, publisher } = harness({ 'org-1': [] });

    const summary = await pumpOutbox({ store, publisher });

    expect(summary).toEqual({ claimed: 0, published: 0, retried: 0, dead: 0 });
    expect(publisher.publish).not.toHaveBeenCalled();
  });
});
