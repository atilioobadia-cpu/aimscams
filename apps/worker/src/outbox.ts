/**
 * The outbox pump.
 *
 * The ledger writes an event in the same transaction as the journal entry.
 * This process only ever sees committed rows, so a crash between commit and
 * publish leaves work to do rather than a lost message. Each row is claimed
 * with `for update skip locked`, which lets several workers share the table
 * without publishing the same event twice.
 *
 * Delivery is at-least-once. The queue job id is the outbox id, and consumers
 * are required to be idempotent, so a replay after a crash is safe.
 */

import { OUTBOX_MAX_ATTEMPTS, outboxBackoffMs } from '@aimscams/ledger';
import type { Pool, PoolClient } from 'pg';

export interface OutboxEvent {
  id: string;
  organisationId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string | null;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  /** Attempt count after this claim. A row is dead once it reaches the limit. */
  attempts: number;
}

export interface OutboxStore {
  /** Organisations that may have work. One database per institution, but the pump stays tenant-explicit. */
  tenants(): Promise<string[]>;
  /** Atomically move due rows to `processing` and take a lease on them. */
  claim(organisationId: string, limit: number, leaseSeconds: number): Promise<OutboxEvent[]>;
  processed(event: OutboxEvent): Promise<void>;
  retry(event: OutboxEvent, error: string, availableAt: Date): Promise<void>;
  dead(event: OutboxEvent, error: string): Promise<void>;
}

export interface OutboxPublisher {
  publish(event: OutboxEvent): Promise<void>;
  /** Copy a dead event to the operator-visible dead-letter queue. */
  deadLetter(event: OutboxEvent, error: string): Promise<void>;
}

export interface PumpSummary {
  claimed: number;
  published: number;
  retried: number;
  dead: number;
}

export interface PumpLogger {
  info(message: string, detail?: Record<string, unknown>): void;
  warn(message: string, detail?: Record<string, unknown>): void;
  error(message: string, detail?: Record<string, unknown>): void;
}

const silentLogger: PumpLogger = {
  info() {},
  warn() {},
  error() {},
};

interface OutboxRow {
  id: string;
  organisation_id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string | null;
  payload: Record<string, unknown>;
  idempotency_key: string;
  attempts: number;
}

function toEvent(row: OutboxRow): OutboxEvent {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    eventType: row.event_type,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    payload: row.payload,
    idempotencyKey: row.idempotency_key,
    attempts: row.attempts,
  };
}

function message(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * PostgreSQL-backed store. Row-level security is forced on `outbox_event`, so
 * every statement runs inside a transaction with the tenant set locally. The
 * setting disappears at commit and cannot leak to the next pool checkout.
 */
export function createOutboxStore(pool: Pool): OutboxStore {
  async function withTenant<T>(
    organisationId: string,
    work: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query(`select set_config('app.organisation_id', $1, true)`, [organisationId]);
      const result = await work(client);
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  return {
    async tenants() {
      const result = await pool.query<{ id: string }>('select id from organisation order by code');
      return result.rows.map((row) => row.id);
    },

    async claim(organisationId, limit, leaseSeconds) {
      return withTenant(organisationId, async (client) => {
        const result = await client.query<OutboxRow>(
          `with due as (
             select id
               from outbox_event
              where organisation_id = $1
                and status in ('pending', 'processing')
                and available_at <= now()
              order by available_at, created_at
              limit $2
              for update skip locked
           )
           update outbox_event e
              set status = 'processing',
                  attempts = e.attempts + 1,
                  available_at = now() + ($3::int * interval '1 second'),
                  last_error = null
             from due
            where e.id = due.id
           returning e.id, e.organisation_id, e.event_type, e.aggregate_type,
                     e.aggregate_id, e.payload, e.idempotency_key, e.attempts`,
          [organisationId, limit, leaseSeconds],
        );
        return result.rows.map(toEvent);
      });
    },

    async processed(event) {
      await withTenant(event.organisationId, (client) =>
        client.query(
          `update outbox_event
              set status = 'processed', processed_at = now(), last_error = null
            where id = $1 and organisation_id = $2`,
          [event.id, event.organisationId],
        ),
      );
    },

    async retry(event, error, availableAt) {
      await withTenant(event.organisationId, (client) =>
        client.query(
          `update outbox_event
              set status = 'pending', available_at = $3, last_error = $4
            where id = $1 and organisation_id = $2`,
          [event.id, event.organisationId, availableAt.toISOString(), error],
        ),
      );
    },

    async dead(event, error) {
      await withTenant(event.organisationId, (client) =>
        client.query(
          `update outbox_event
              set status = 'dead', last_error = $3
            where id = $1 and organisation_id = $2`,
          [event.id, event.organisationId, error],
        ),
      );
    },
  };
}

export interface PumpOptions {
  store: OutboxStore;
  publisher: OutboxPublisher;
  batchSize?: number;
  leaseSeconds?: number;
  logger?: PumpLogger;
}

/**
 * One pass over every tenant's due events. Returns counts so the poll loop can
 * log only when it did something; an idle poll is silent.
 */
export async function pumpOutbox(options: PumpOptions): Promise<PumpSummary> {
  const { store, publisher } = options;
  const batchSize = Math.max(1, options.batchSize ?? 25);
  const leaseSeconds = Math.max(5, options.leaseSeconds ?? 60);
  const logger = options.logger ?? silentLogger;
  const summary: PumpSummary = { claimed: 0, published: 0, retried: 0, dead: 0 };

  for (const organisationId of await store.tenants()) {
    const events = await store.claim(organisationId, batchSize, leaseSeconds);
    summary.claimed += events.length;

    for (const event of events) {
      try {
        await publisher.publish(event);
        await store.processed(event);
        summary.published += 1;
      } catch (error) {
        const reason = message(error);

        if (event.attempts >= OUTBOX_MAX_ATTEMPTS) {
          await store.dead(event, reason);
          summary.dead += 1;
          logger.error('outbox.dead', {
            eventId: event.id,
            eventType: event.eventType,
            attempts: event.attempts,
            reason,
          });
          try {
            await publisher.deadLetter(event, reason);
          } catch (deadLetterError) {
            logger.error('outbox.dead-letter-failed', {
              eventId: event.id,
              reason: message(deadLetterError),
            });
          }
          continue;
        }

        const availableAt = new Date(Date.now() + outboxBackoffMs(event.attempts));
        await store.retry(event, reason, availableAt);
        summary.retried += 1;
        logger.warn('outbox.retry', {
          eventId: event.id,
          eventType: event.eventType,
          attempts: event.attempts,
          availableAt: availableAt.toISOString(),
          reason,
        });
      }
    }
  }

  return summary;
}
