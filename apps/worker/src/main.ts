/**
 * AIMSCAMS worker.
 *
 * The only job in Phase 3 is moving committed outbox events into BullMQ. No
 * business row is written here: the ledger transaction already wrote the
 * entry and its event together. Later phases register consumers for the same
 * queue, and each consumer must be idempotent because delivery is at-least-once.
 */

import { config } from 'dotenv';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import {
  createOutboxStore,
  pumpOutbox,
  type OutboxEvent,
  type OutboxPublisher,
  type PumpLogger,
} from './outbox.js';

config({
  path: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')],
  quiet: true,
});

export const QUEUE_OUTBOX = 'outbox';
export const QUEUE_OUTBOX_DEAD = 'outbox-dead';

export const OUTBOX_JOB = 'outbox.event';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;

function log(
  level: keyof typeof LEVELS,
  message: string,
  detail: Record<string, unknown> = {},
): void {
  const configured = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  const threshold = LEVELS[configured as keyof typeof LEVELS] ?? LEVELS.info;
  if (LEVELS[level] < threshold) return;
  console.log(JSON.stringify({ level, service: 'aimscams-worker', message, ...detail }));
}

const logger: PumpLogger = {
  info: (message, detail) => log('info', message, detail),
  warn: (message, detail) => log('warn', message, detail),
  error: (message, detail) => log('error', message, detail),
};

/**
 * Phase 3 consumes the journal event only to prove the path end to end. The
 * loan, savings and payment modules register their own handlers in later
 * phases; an unregistered event type is refused rather than silently dropped.
 */
const handlers = new Map<string, (event: OutboxEvent) => Promise<void>>([
  [
    'journal.posted',
    async (event) => {
      log('debug', 'outbox.journal-posted', {
        eventId: event.id,
        entryId: event.payload.entryId,
        entryNo: event.payload.entryNo,
      });
    },
  ],
]);

/**
 * BullMQ 6 loads `ioredis` lazily, which a native ESM worker cannot do. Pass
 * constructed clients instead, one per role so a shutdown closes just what it
 * owns. A queue client is not a worker client: the worker blocks a connection
 * while it waits for jobs.
 */
function createRedis(url: string): Redis {
  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (attempt) => Math.min(attempt * 200, 5000),
  });
  client.on('error', (error: Error) => {
    log('error', 'redis.error', { reason: error.message });
  });
  return client;
}

async function closeRedis(client: Redis): Promise<void> {
  try {
    await client.quit();
  } catch {
    client.disconnect();
  }
}

function positiveInt(value: string | undefined, fallback: number, minimum: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.trunc(parsed));
}

export interface WorkerHandle {
  stop(): Promise<void>;
  /** Exposed for the smoke test and future health probes. */
  tick(): Promise<void>;
}

export async function startWorker(): Promise<WorkerHandle> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const pollMs = positiveInt(process.env.OUTBOX_POLL_MS, 1000, 250);
  const batchSize = positiveInt(process.env.OUTBOX_BATCH, 25, 1);
  const leaseSeconds = positiveInt(process.env.OUTBOX_LEASE_SECONDS, 60, 30);

  const pool = new Pool({ connectionString: databaseUrl, max: 4 });
  const store = createOutboxStore(pool);
  const queueRedis = createRedis(redisUrl);
  const deadRedis = createRedis(redisUrl);
  const workerRedis = createRedis(redisUrl);
  const queue = new Queue<OutboxEvent>(QUEUE_OUTBOX, {
    connection: queueRedis,
    defaultJobOptions: {
      removeOnComplete: { age: 86_400, count: 10_000 },
      removeOnFail: { age: 604_800, count: 10_000 },
    },
  });
  const deadQueue = new Queue<OutboxEvent & { error: string }>(QUEUE_OUTBOX_DEAD, {
    connection: deadRedis,
  });

  const publisher: OutboxPublisher = {
    async publish(event) {
      await queue.add(event.eventType, event, { jobId: event.id });
    },
    async deadLetter(event, error) {
      await deadQueue.add(event.eventType, { ...event, error }, { jobId: `dlq-${event.id}` });
    },
  };

  const consumer = new Worker<OutboxEvent>(
    QUEUE_OUTBOX,
    async (job) => {
      const event = job.data;
      const handler = handlers.get(event.eventType);
      if (!handler) throw new Error(`no consumer for outbox event ${event.eventType}`);
      await handler(event);
    },
    { connection: workerRedis, concurrency: 4 },
  );

  consumer.on('failed', (job, error) => {
    log('error', 'outbox.consumer-failed', {
      jobId: job?.id,
      eventType: job?.data.eventType,
      reason: error.message,
    });
  });

  let running = true;
  let timer: NodeJS.Timeout | undefined;
  let pumping = false;

  async function tick(): Promise<void> {
    if (pumping) return;
    pumping = true;
    try {
      const summary = await pumpOutbox({ store, publisher, batchSize, leaseSeconds, logger });
      if (summary.claimed > 0) log('info', 'outbox.pump', { ...summary });
    } catch (error) {
      log('error', 'outbox.pump-failed', {
        reason: error instanceof Error ? error.message : String(error),
      });
    } finally {
      pumping = false;
    }
  }

  function schedule(): void {
    if (!running) return;
    timer = setTimeout(() => {
      void tick().finally(schedule);
    }, pollMs);
  }

  const counts = await deadQueue.getJobCounts('waiting', 'active', 'failed');
  log('info', 'worker.ready', {
    queue: QUEUE_OUTBOX,
    deadLetterQueue: QUEUE_OUTBOX_DEAD,
    dead: counts,
    redis: redisUrl.replace(/\/\/.*@/, '//***@'),
    pollMs,
    batchSize,
    leaseSeconds,
  });

  void tick().finally(schedule);

  return {
    tick,
    async stop() {
      running = false;
      if (timer) clearTimeout(timer);
      await consumer.close();
      await queue.close();
      await deadQueue.close();
      await Promise.allSettled([
        closeRedis(queueRedis),
        closeRedis(deadRedis),
        closeRedis(workerRedis),
      ]);
      await pool.end();
      log('info', 'worker.stopped');
    },
  };
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const handle = await startWorker();

  let stopping = false;
  const shutdown = (signal: string) => {
    if (stopping) return;
    stopping = true;
    log('info', 'worker.shutdown', { signal });
    void handle.stop().then(
      () => process.exit(0),
      (error: unknown) => {
        log('error', 'worker.shutdown-failed', {
          reason: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
      },
    );
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
