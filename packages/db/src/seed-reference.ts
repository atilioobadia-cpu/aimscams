/**
 * Reference-content fixture for the UI comparison harness.
 *
 * The harness compares our rendered pages against captured reference screenshots.
 * Text and numbers must match for the comparison to mean anything, so this script
 * loads the reference institution's identity and chart of accounts into the demo
 * database. It is a fixture, not application seed data: `npm run db:seed` stays the
 * canonical demo seed.
 *
 * Run: npm run seed:reference -w @aimscams/db
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { Client } from "pg";

type CsvRow = { code: string; name: string; kind: string; parent: string };

const ROOT_TYPES: Record<string, { type: string; normalBalance: "debit" | "credit" }> = {
  Assets: { type: "asset", normalBalance: "debit" },
  "Liabilities and Owners Equity": { type: "liability", normalBalance: "credit" },
  "Capital Account": { type: "equity", normalBalance: "credit" },
  Incomes: { type: "income", normalBalance: "credit" },
  Expenses: { type: "expense", normalBalance: "debit" },
};

const ROOT_CODES: Record<string, string> = {
  Assets: "1",
  "Liabilities and Owners Equity": "2",
  "Capital Account": "3",
  Incomes: "4",
  Expenses: "5",
};

/** Opening balances and closing targets read from the reference chart of accounts. */
const ROOT_BALANCES: Record<string, { opening: bigint; closing: bigint }> = {
  Assets: { opening: 232_342_980n, closing: 11_011_120_864n },
  "Liabilities and Owners Equity": { opening: 0n, closing: 132_790n },
  "Capital Account": { opening: 0n, closing: 10_700_000_000n },
  Incomes: { opening: 0n, closing: 992_177_783n },
  Expenses: { opening: 0n, closing: 913_532_689n },
};

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const [header, ...body] = rows.filter((entry) => entry.some((cell) => cell.trim() !== ""));
  const index = (name: string) => header.findIndex((cell) => cell.trim() === name);
  const codeAt = index("code");
  const nameAt = index("name");
  const typeAt = index("type");
  const parentAt = index("parent");
  return body.map((entry) => ({
    code: (entry[codeAt] ?? "").trim(),
    name: (entry[nameAt] ?? "").trim(),
    kind: (entry[typeAt] ?? "").trim(),
    parent: (entry[parentAt] ?? "").trim(),
  }));
}

async function main() {
  const csvPath =
    process.env.REFERENCE_COA ??
    fileURLToPath(new URL("../../../docs/audit/coa-reference.csv", import.meta.url));
  const rows = parseCsv(readFileSync(csvPath, "utf8"));

  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/aimscams_dev?schema=public",
  });
  await client.connect();
  await client.query("begin");

  try {
    const organisation = await client.query<{ id: string }>(
      "select id from organisation where code = $1",
      [process.env.INSTITUTION_CODE ?? "AIM-DEMO"],
    );
    if (organisation.rowCount === 0) {
      throw new Error("Demo organisation not found. Run npm run db:seed first.");
    }
    const organisationId = organisation.rows[0].id;

    await client.query("select set_config('app.organisation_id', $1, true)", [organisationId]);

    await client.query(
      `update organisation
          set name = $2, "registrationNo" = $3
        where id = $1`,
      [organisationId, "MFSL MFI", "101457"],
    );
    await client.query(`update branch set name = 'MFSL MWANZA' where "organisationId" = $1`, [
      organisationId,
    ]);
    await client.query(
      `update app_user set "fullName" = 'Ally Juma Ally' where email = 'admin@aimscams.local'`,
    );

    const ids = new Map<string, string>();
    const byCode = new Map(rows.filter((row) => row.code).map((row) => [row.code, row]));
    const byName = new Map(rows.map((row) => [row.name, row]));
    const codeOf = (row: CsvRow) => (row.parent ? row.code : ROOT_CODES[row.name] ?? row.name);
    const rootNameOf = (row: CsvRow) => {
      let current = row;
      while (current.parent) {
        const next = byCode.get(current.parent) ?? byName.get(current.parent);
        if (!next) break;
        current = next;
      }
      return current.name;
    };

    await client.query("delete from journal_line where organisation_id = $1", [organisationId]);
    await client.query("delete from journal_entry where organisation_id = $1", [organisationId]);
    await client.query("delete from gl_account where organisation_id = $1", [organisationId]);

    for (const row of rows) {
      const rootName = rootNameOf(row);
      const meta = ROOT_TYPES[rootName];
      if (!meta) {
        throw new Error(`Unmapped root "${rootName}" for account ${row.name}`);
      }
      const code = codeOf(row);
      const isGroup = row.kind === "Group";
      const balance = ROOT_BALANCES[row.name];
      const parentId = row.parent ? ids.get(row.parent) ?? null : null;

      const inserted = await client.query<{ id: string }>(
        `insert into gl_account
           (organisation_id, code, name, type, normal_balance, is_postable, is_group,
            is_assumption, parent_id, opening_balance_minor)
         values ($1, $2, $3, $4, $5, $6, $7, false, $8, $9)
         returning id`,
        [
          organisationId,
          code,
          row.name,
          meta.type,
          meta.normalBalance,
          !isGroup,
          isGroup,
          parentId,
          row.parent ? 0n : balance?.opening ?? 0n,
        ],
      );
      ids.set(row.name, inserted.rows[0].id);
      if (row.code) ids.set(row.code, inserted.rows[0].id);
    }

    const period = await client.query<{ id: string }>(
      `select id from fiscal_period where organisation_id = $1 and starts_on <= date '2026-01-01'
        order by starts_on desc limit 1`,
      [organisationId],
    );
    let periodId = period.rows[0]?.id;
    if (!periodId) {
      const created = await client.query<{ id: string }>(
        `insert into fiscal_period (organisation_id, starts_on, ends_on, status)
         values ($1, date '2026-01-01', date '2026-12-31', 'open')
         returning id`,
        [organisationId],
      );
      periodId = created.rows[0].id;
    }

    const entry = await client.query<{ id: string }>(
      `insert into journal_entry
         (organisation_id, entry_date, period_id, event_code, source_type, source_id,
          description, status, idempotency_key, posted_at)
       values ($1, date '2026-01-01', $2, 'opening_balance', 'fixture', 'reference-opening',
               'Opening balances imported with the chart of accounts', 'posted',
               'reference-opening-balances', now())
       returning id`,
      [organisationId, periodId],
    );
    const entryId = entry.rows[0].id;

    let lineNo = 1;
    for (const [name, balance] of Object.entries(ROOT_BALANCES)) {
      const delta = balance.closing - balance.opening;
      if (delta === 0n) continue;
      const debitAccount = name === "Assets" || name === "Expenses";
      await client.query(
        `insert into journal_line
           (organisation_id, entry_id, line_no, account_id, debit_minor, credit_minor, memo)
         values ($1, $2, $3, $4, $5, $6, 'Opening balance')`,
        [
          organisationId,
          entryId,
          lineNo,
          ids.get(name),
          debitAccount ? delta : 0n,
          debitAccount ? 0n : delta,
        ],
      );
      lineNo += 1;
    }

    await client.query("commit");
    console.log(
      JSON.stringify({
        service: "aimscams-seed-reference",
        status: "ok",
        accounts: rows.length,
        organisation: organisationId,
      }),
    );
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
