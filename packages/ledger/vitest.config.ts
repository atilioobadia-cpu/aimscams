import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Every ledger test bootstraps an in-process PostgreSQL (PGlite) and applies
    // schema.sql. On Windows with a cold page cache that exceeds Vitest's 5s
    // default; 30s keeps the assertion timeout meaningful without flaking.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
