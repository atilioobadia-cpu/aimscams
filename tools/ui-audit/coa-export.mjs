/**
 * Exports the live chart of accounts through the API to docs/audit/coa-current.csv.
 * Read-only. Uses the saved audit login (cookies) against the API.
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const apiUrl = process.env.AUDIT_API_URL ?? "http://localhost:4000";
const storageState = resolve(repoRoot, "artifacts/storage-state.json");
const outFile = resolve(repoRoot, "docs/audit/coa-current.csv");

if (!existsSync(storageState)) {
  console.error(`Missing storage state: ${storageState}`);
  process.exit(2);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState });
const response = await context.request.get(`${apiUrl}/accounting/chart-of-accounts`);
if (!response.ok()) {
  console.error(`API responded ${response.status()}`);
  await browser.close();
  process.exit(1);
}
const body = await response.json();
await browser.close();

const rows = Array.isArray(body) ? body : body.items ?? body.accounts ?? [];
const header = "code,name,type,parent,normal_balance,status,is_assumption";
const escape = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const lines = rows.map((row) =>
  [
    row.code,
    row.name,
    row.is_postable ? "Ledger" : "Group",
    "",
    row.normal_balance,
    "active",
    row.is_assumption ? "true" : "false",
  ]
    .map(escape)
    .join(","),
);
await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, [header, ...lines].join("\n") + "\n", "utf8");
console.log(`Exported ${rows.length} accounts to ${outFile}`);
