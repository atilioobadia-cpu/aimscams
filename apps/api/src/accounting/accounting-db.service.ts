import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import type { Db } from '@aimscams/ledger';
import { Pool } from 'pg';

@Injectable()
export class AccountingDbService implements OnApplicationShutdown {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  async getDb(): Promise<Db> {
    const client = await this.pool.connect();
    return {
      query: async <T = Record<string, unknown>>(sql: string, params?: readonly unknown[]) => {
        const result = await client.query(sql, params ? [...params] : undefined);
        return { rows: result.rows as T[] };
      },
      exec: async (sql: string) => {
        await client.query(sql);
      },
      transaction: async <T>(work: (tx: Db) => Promise<T>) => {
        await client.query('BEGIN');
        try {
          const tx: Db = {
            query: async <U = Record<string, unknown>>(sql: string, params?: readonly unknown[]) => {
              const result = await client.query(sql, params ? [...params] : undefined);
              return { rows: result.rows as U[] };
            },
            exec: async (sql: string) => {
              await client.query(sql);
            },
            transaction: async <U>(w: (t: Db) => Promise<U>) => w(tx),
            close: async () => {},
          };
          const result = await work(tx);
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      },
      close: async () => {
        client.release();
      },
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
