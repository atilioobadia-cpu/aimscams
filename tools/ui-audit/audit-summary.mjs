/**
 * Classifies docs/audit/route-crawl.json into docs/audit/system-audit.md.
 * Status rules:
 *   Buggy     - HTTP error, navigation error, console error/pageerror, failed API call,
 *               Wakandi text, or horizontal overflow at 1280.
 *   In build  - placeholder text ("In build", "Coming soon", "Under construction").
 *   OK        - none of the above.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const crawl = JSON.parse(readFileSync(resolve(repoRoot, "docs/audit/route-crawl.json"), "utf8"));
const dynamicCrawl = JSON.parse(readFileSync(resolve(repoRoot, "docs/audit/route-crawl-dynamic.json"), "utf8"));
crawl.results = [...crawl.results, ...dynamicCrawl.results];

const inBuildFlags = ["in build", "coming soon", "under construction"];

function classify(result) {
  const problems = [];
  const flags = result.facts?.flagged ?? [];
  if (result.error) problems.push(`navigation error: ${result.error}`);
  if (result.status && result.status >= 400) problems.push(`HTTP ${result.status}`);
  const redirected = Boolean(result.finalPath && result.finalPath !== (result.requestedPath ?? result.route));
  for (const issue of result.consoleIssues) problems.push(issue);
  for (const request of result.failedRequests) problems.push(`API ${request}`);
  if (flags.includes("wakandi")) problems.push("Wakandi text on page");
  if ((result.facts?.overflowX ?? 0) > 0) problems.push(`horizontal overflow ${result.facts.overflowX}px`);

  const placeholder = flags.some((flag) => inBuildFlags.includes(flag));
  let status = "OK";
  if (placeholder) status = "In build";
  if (redirected && !placeholder) status = "Redirect";
  if (problems.length) status = "Buggy";
  if (redirected) problems.unshift(`redirects to ${result.finalPath}`);
  return { status, problems, placeholder };
}

const rows = crawl.results.map((result) => ({ ...result, verdict: classify(result) }));
const counts = { OK: 0, "In build": 0, Buggy: 0, Redirect: 0 };
for (const row of rows) counts[row.verdict.status] += 1;

const lines = [];
lines.push("# System audit (Phase 1)", "");
lines.push(`Generated ${new Date().toISOString()} from \`docs/audit/route-crawl.json\` (crawl of ${crawl.baseUrl}, viewport ${crawl.viewport}).`, "");
lines.push("## Summary", "");
lines.push(`- Routes crawled: ${rows.length} (${crawl.results.length - dynamicCrawl.results.length} static, ${dynamicCrawl.results.length} dynamic)`);
lines.push(`- Dynamic routes crawled with a real record id: ${dynamicCrawl.results.filter((row) => !row.error || !row.error.startsWith("no record")).length} of ${dynamicCrawl.results.length}`);
lines.push(`- OK: ${counts.OK}`);
lines.push(`- In build (placeholder): ${counts["In build"]}`);
lines.push(`- Buggy: ${counts.Buggy}`);
lines.push(`- Not linked from the sidebar: ${rows.filter((row) => !row.linkedInSidebar).length}`);
lines.push("");
lines.push("Severity: **High** = placeholder or broken page that users reach from the sidebar; **Medium** = page works but has a defect (console, API, overflow); **Low** = orphan route or cosmetic. Pages with no defect and linked from the sidebar are not listed as issues.", "");

lines.push("## Every route", "");
lines.push("| Route | Linked | Heading (h1) | Status | Exact problem | Severity |");
lines.push("| --- | --- | --- | --- | --- | --- |");
for (const row of rows) {
  const linked = row.linkedInSidebar ? "Yes" : "No";
  const heading = (row.facts?.h1 ?? "N/A").replace(/\|/g, "/");
  let problem = row.verdict.problems.join("; ") || "None";
  if (row.verdict.placeholder) {
    problem = `Placeholder text: ${row.facts.flagged.filter((flag) => inBuildFlags.includes(flag)).join(", ")}${row.verdict.problems.length ? "; " + row.verdict.problems.join("; ") : ""}`;
  }
  problem = problem.replace(/\|/g, "/");
  let severity = "None";
  if (row.verdict.status === "In build") severity = row.linkedInSidebar ? "High" : "Medium";
  if (row.verdict.status === "Buggy") severity = row.linkedInSidebar ? "Medium" : "Low";
  if (row.verdict.status === "OK" && !row.linkedInSidebar) severity = "Low";
  lines.push(`| \`${row.route}\` | ${linked} | ${heading} | ${row.verdict.status} | ${problem} | ${severity} |`);
}
lines.push("", "## Dynamic routes not crawled", "");
const skippedDynamic = dynamicCrawl.results.filter((row) => row.error && row.error.startsWith("no record"));
if (skippedDynamic.length === 0) lines.push("None. Every dynamic route was tested with a real record.");
for (const row of skippedDynamic) lines.push(`- \`${row.route}\`: ${row.error}`);
lines.push("");

const outFile = resolve(repoRoot, "docs/audit/system-audit.md");
writeFileSync(outFile, lines.join("\n"), "utf8");
console.log(JSON.stringify(counts), "written", outFile);
