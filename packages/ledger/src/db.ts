import { readFileSync } from 'node:fs';

import { PGlite } from '@electric-sql/pglite';

export interface QueryResult<T> {
  rows: T[];
}

export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<QueryResult<T>>;
  exec(sql: string): Promise<void>;
  transaction<T>(work: (tx: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');

interface PgLike {
  query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<unknown>;
  transaction<T>(work: (tx: PgLike) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

function wrap(pg: PgLike): Db {
  return {
    query: (sql, params) => pg.query(sql, params ? [...params] : undefined),
    exec: async (sql) => {
      await pg.exec(sql);
    },
    transaction: (work) => pg.transaction((tx) => work(wrap(tx))),
    close: () => pg.close(),
  };
}

/**
 * An in-process PostgreSQL (PGlite) with the ledger schema applied.
 *
 * The same schema and the same SQL run against a real PostgreSQL server in
 * staging and production; nothing here is a mock. PGlite exists so the
 * constraints can be tested without Docker on a developer machine.
 */
export async function createDatabase(): Promise<Db> {
  const pg = new PGlite() as unknown as PgLike;
  await pg.exec(schema);
  return wrap(pg);
}
