import { config } from "dotenv";
import { resolve } from "node:path";

config({
  path: [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")],
  quiet: true,
});

/**
 * Phase 0 placeholder. Queue names and consumers are added with the outbox in
 * Phase 3 (see docs/13-build-sequence.md). This process must never write
 * business rows directly; it consumes outbox events after commit.
 */
export const QUEUE_OUTBOX = "outbox";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

console.log(
  JSON.stringify({
    service: "aimscams-worker",
    status: "ready",
    queue: QUEUE_OUTBOX,
    redis: redisUrl,
  }),
);
