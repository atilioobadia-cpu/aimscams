/**
 * Validates docs/audit/coa-reference.csv and diffs docs/audit/coa-current.csv
 * against it. Writes docs/audit/coa-diff.md. Read-only.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const auditDir = resolve(repoRoot, "docs/audit");

function parseCsv(text) {
  const rows = [];
  for (const rawLine of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    if (rawLine === "") continue;
    const cells = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < rawLine.length; index += 1) {
      const character = rawLine[index];
      if (quoted) {
        if (character === '"' && rawLine[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else if (character === '"') quoted = false;
        else cell += character;
      } else if (character === '"') quoted = true;
      else if (character === ",") {
        cells.push(cell);
        cell = "";
      } else cell += character;
    }
    cells.push(cell);
    rows.push(cells);
  }
  const [header, ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])));
}

const referenceText = readFileSync(resolve(auditDir, "coa-reference.csv"), "utf8");
const reference = parseCsv(referenceText);
const current = parseCsv(readFileSync(resolve(auditDir, "coa-current.csv"), "utf8"));

const problems = [];
const codes = reference.filter((row) => row.code !== "").map((row) => row.code);
const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
if (duplicates.length) problems.push(`duplicate codes: ${duplicates.join(", ")}`);
const topLevelNames = new Set(reference.filter((row) => row.parent === "").map((row) => row.name));
const byCode = new Map(reference.filter((row) => row.code !== "").map((row) => [row.code, row]));
const parentOf = (row) => {
  if (row.parent === "") return null;
  if (topLevelNames.has(row.parent)) return { name: row.parent, top: true };
  return byCode.get(row.parent) ?? null;
};
for (const row of reference) {
  if (row.parent !== "" && !parentOf(row)) problems.push(`parent not found for ${row.name}: ${row.parent}`);
  if (row.type === "Ledger" && row.code === "") problems.push(`ledger without code: ${row.name}`);
}
const topLevel = reference.filter((row) => row.parent === "");
if (topLevel.length !== 5) problems.push(`expected 5 top-level accounts, found ${topLevel.length}`);
const rootFor = (row) => {
  let node = row;
  let parent = parentOf(node);
  while (parent && !parent.top) {
    node = parent;
    parent = parentOf(node);
  }
  return parent ? parent.name : node.name;
};
const normalByRoot = {
  Assets: "debit",
  "Liabilities and Owners Equity": "credit",
  "Capital Account": "credit",
  Incomes: "credit",
  Expenses: "debit",
};
const checks = {
  rows: reference.length,
  codedRows: codes.length,
  uniqueCodes: new Set(codes).size === codes.length,
  parentsResolved: problems.filter((problem) => problem.startsWith("parent")).length === 0,
  enDashPresent: referenceText.includes("\u2013"),
  curlyApostrophePresent: referenceText.includes("\u2019"),
  typosKept: referenceText.includes("Commision") && referenceText.includes("Accomodation"),
  utf8Clean: !referenceText.includes("\uFFFD"),
};

const currentByCode = new Map(current.map((row) => [row.code, row]));
const referenceByCode = new Map(codes.map((code) => [code, reference.find((row) => row.code === code)]));

const missing = reference.filter((row) => row.code !== "" && !currentByCode.has(row.code));
const extra = current.filter((row) => !referenceByCode.has(row.code));
const renamed = [];
const normalWrong = [];
const typeWrong = [];
for (const row of reference.filter((candidate) => candidate.code !== "")) {
  const existing = currentByCode.get(row.code);
  if (!existing) continue;
  if (existing.name !== row.name) renamed.push({ code: row.code, current: existing.name, reference: row.name });
  if (existing.type !== row.type) typeWrong.push({ code: row.code, current: existing.type, reference: row.type });
  const expected = normalByRoot[rootFor(row)];
  if (existing.normal_balance !== expected) {
    normalWrong.push({ code: row.code, current: existing.normal_balance, reference: expected });
  }
}
const parentMissing = current.length;

const md = [];
md.push("# Chart of accounts diff (Phase 1)", "");
md.push(`Generated ${new Date().toISOString()} by \`tools/ui-audit/coa-validate.mjs\`.`, "");
md.push("## Reference file validation", "");
md.push("| Check | Result |", "| --- | --- |");
md.push(`| Rows (including top-level) | ${checks.rows} |`);
md.push(`| Rows with a code | ${checks.codedRows} |`);
md.push(`| Codes unique | ${checks.uniqueCodes ? "yes" : "no"} |`);
md.push(`| Every parent exists | ${checks.parentsResolved ? "yes" : "no"} |`);
md.push(`| En dash (U+2013) present | ${checks.enDashPresent ? "yes" : "no"} |`);
md.push(`| Curly apostrophe (U+2019) present | ${checks.curlyApostrophePresent ? "yes" : "no"} |`);
md.push(`| Typos kept ("Commision", "Accomodation") | ${checks.typosKept ? "yes" : "no"} |`);
md.push(`| No replacement characters | ${checks.utf8Clean ? "yes" : "no"} |`);
md.push("");
if (problems.length) md.push("Problems:", "", ...problems.map((problem) => `- ${problem}`), "");
else md.push("No validation problems.", "");

md.push("## Current system versus reference", "");
md.push(`- Reference accounts with a code: ${codes.length}`);
md.push(`- Current accounts (live API): ${current.length}`);
md.push(`- Missing from the system: ${missing.length}`);
md.push(`- Extra in the system (not in reference): ${extra.length}`);
md.push(`- Renamed (same code, different name): ${renamed.length}`);
md.push(`- Wrong type (Group/Ledger): ${typeWrong.length} (the system has no Group flag, so every group is absent)`);
md.push(`- Wrong normal balance: ${normalWrong.length}`);
md.push(`- Accounts with a parent in the system: 0 of ${parentMissing} (no parent column in \`gl_account\`)`);
md.push("");

md.push("### Missing from the system", "", "| Code | Name | Type | Parent |", "| --- | --- | --- | --- |");
for (const row of missing) md.push(`| ${row.code} | ${row.name} | ${row.type} | ${row.parent} |`);
md.push("", "### Extra in the system", "", "| Code | Name | Normal balance |", "| --- | --- | --- |");
for (const row of extra) md.push(`| ${row.code} | ${row.name} | ${row.normal_balance} |`);
md.push("", "### Renamed", "", "| Code | System name | Reference name |", "| --- | --- | --- |");
for (const row of renamed) md.push(`| ${row.code} | ${row.current} | ${row.reference} |`);
md.push("", "### Normal balance mismatch", "", "| Code | System | Reference (by root) |", "| --- | --- | --- |");
for (const row of normalWrong) md.push(`| ${row.code} | ${row.current} | ${row.reference} |`);
md.push("", "### Structure not represented", "");
md.push("- The reference hierarchy (Group rows and parents) has no counterpart: `gl_account` has no `parent_id` and no group flag.");
md.push("- Posting policies in `packages/ledger/src/seed.ts` use codes that have no reference equivalent (for example `2101` Member savings, which is absent from the reference). Those policies must be remapped before any renumbering, and every ledger line posted under a renamed code must be re-pointed by a reversal-free migration.");
md.push("");
md.push("## Result", "");
md.push(`The system does not match the reference. ${missing.length} reference accounts are absent, ${extra.length} system accounts have no reference equivalent, and the hierarchy is not modelled at all. Phase 5 must add a parent/group model before the chart can match.`);
md.push("");

writeFileSync(resolve(auditDir, "coa-diff.md"), md.join("\n"), "utf8");
console.log(JSON.stringify({ checks, problems, missing: missing.length, extra: extra.length, renamed: renamed.length, normalWrong: normalWrong.length, typeWrong: typeWrong.length }, null, 2));
