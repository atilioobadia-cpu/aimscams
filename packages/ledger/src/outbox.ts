/**
 * The transactional outbox.
 *
 * An event is written inside the same transaction as the row that caused it.
 * Nothing is handed to a queue before that transaction commits, so a crash
 * between "committed" and "published" leaves a pending row, not a lost message.
 * Publishing is idempotent: the unique key is the message identity.
 */

import type { Db } from './db.js';

export interface OutboxEventInput {
  tenantId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string | null;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  availableAt?: string;
}

export interface EnqueuedEvent {
  id: string;
  reused: boolean;
}

export async function enqueueOutbox(db: Db, input: OutboxEventInput): Promise<EnqueuedEvent> {
  const inserted = await db.query<{ id: string }>(
    `insert into outbox_event
       (organisation_id, event_type, aggregate_type, aggregate_id, payload,
        idempotency_key, available_at)
     values ($1, $2, $3, $4, $5::jsonb, $6, coalesce($7::timestamptz, now()))
     on conflict (organisation_id, idempotency_key) do nothing
     returning id`,
    [
      input.tenantId,
      input.eventType,
      input.aggregateType,
      input.aggregateId,
      JSON.stringify(input.payload),
      input.idempotencyKey,
      input.availableAt ?? null,
    ],
  );

  const row = inserted.rows[0];
  if (row) return { id: row.id, reused: false };

  const existing = await db.query<{ id: string }>(
    `select id from outbox_event where organisation_id = $1 and idempotency_key = $2`,
    [input.tenantId, input.idempotencyKey],
  );
  const id = existing.rows[0]?.id;
  if (!id) throw new Error(`outbox event ${input.idempotencyKey} could not be written or found`);
  return { id, reused: true };
}

/** The delivery contract shared by the worker and the tests. */
export const OUTBOX_MAX_ATTEMPTS = 5;

export function outboxBackoffMs(attempts: number): number {
  const safe = Math.max(1, Math.min(attempts, OUTBOX_MAX_ATTEMPTS));
  return Math.min(60_000, 1_000 * 2 ** (safe - 1));
}
