import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

export { PrismaClient } from "./generated/prisma/client.js";
export * from "./generated/prisma/enums.js";

/**
 * One client per API/worker process. The connection string is supplied by the
 * runtime environment, never compiled into the image.
 */
export function createPrismaClient(connectionString = process.env.DATABASE_URL): PrismaClient {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create a Prisma client.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}
