/**
 * Phase 1 inventory crawl. Visits every static authenticated route, records what
 * the browser shows, and writes docs/audit/route-crawl.json.
 *
 * Env: AUDIT_BASE_URL (default http://localhost:3000), AUDIT_STORAGE_STATE.
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const baseUrl = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const storageState = process.env.AUDIT_STORAGE_STATE
  ? resolve(process.env.AUDIT_STORAGE_STATE)
  : resolve(repoRoot, "artifacts/storage-state.json");
const appDir = resolve(repoRoot, "apps/web/src/app/(app)");
const outFile = resolve(repoRoot, "docs/audit/route-crawl.json");

if (!existsSync(storageState)) {
  console.error(`Missing storage state: ${storageState}`);
  process.exit(2);
}

async function findPages(dir) {
  const found = [];
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    if ((await stat(full)).isDirectory()) {
      found.push(...(await findPages(full)));
    } else if (entry === "page.tsx") {
      found.push(full);
    }
  }
  return found;
}

const pageFiles = await findPages(appDir);
const routes = [];
const dynamicRoutes = [];
for (const file of pageFiles) {
  const rel = relative(appDir, dirname(file)).split(sep).join("/");
  const route = rel === "" ? "/" : `/${rel}`;
  if (route.includes("[")) dynamicRoutes.push(route);
  else routes.push(route);
}
routes.sort();
dynamicRoutes.sort();

const navSource = await readFile(resolve(repoRoot, "apps/web/src/lib/nav.ts"), "utf8");
const linked = new Set([...navSource.matchAll(/href:\s*"(\/[^"]*)"/g)].map((match) => match[1]));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState,
  viewport: { width: 1280, height: 800 },
});

const dynamicMode = process.env.AUDIT_DYNAMIC === "1";
const idSources = {
  "/account-loan-application-details": "/settings/loan-applications",
  "/account-loan-application-edit": "/settings/loan-applications",
  "/account-loan-details": "/settings/loans",
  "/clients": "/settings/clients",
  "/settings/branches": "/settings/branches",
  "/settings/policies/credit-product": "/settings/policies/credit-product",
  "/settings/policies/membership": "/settings/policies/membership",
  "/settings/products/loan": "/settings/products/loans",
  "/settings/products/savings": "/settings/products/savings",
};
const idCache = new Map();
async function firstId(endpoint) {
  if (!idCache.has(endpoint)) {
    const response = await context.request.get(`http://localhost:4000${endpoint}`);
    const body = response.ok() ? await response.json() : {};
    const items = Array.isArray(body) ? body : body.items ?? [];
    idCache.set(endpoint, items[0]?.id ?? null);
  }
  return idCache.get(endpoint);
}
const concreteRoutes = [];
if (dynamicMode) {
  for (const route of dynamicRoutes) {
    const base = route.replace(/\/\[id\].*$/, "");
    const suffix = route.replace(/^.*?\[id\]/, "");
    const endpoint = Object.entries(idSources).find(([prefix]) => base === prefix)?.[1];
    const id = endpoint ? await firstId(endpoint) : null;
    if (!id) {
      concreteRoutes.push({ route, skipped: "no record available to test" });
    } else {
      concreteRoutes.push({ route, url: `${base}/${id}${suffix}` });
    }
  }
} else {
  for (const route of routes) concreteRoutes.push({ route, url: route });
}

const results = [];
for (const { route, url, skipped } of concreteRoutes) {
  if (skipped) {
    results.push({ route, linkedInSidebar: false, status: null, finalPath: null, error: skipped, facts: null, consoleIssues: [], failedRequests: [] });
    continue;
  }
  const page = await context.newPage();
  const consoleIssues = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleIssues.push(`${message.type()}: ${message.text().slice(0, 200)}`);
    }
  });
  page.on("pageerror", (error) => consoleIssues.push(`pageerror: ${error.message.slice(0, 200)}`));
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().startsWith("http://localhost:4000")) {
      failedRequests.push(`${response.status()} ${new URL(response.url()).pathname}`);
    }
  });

  let status = null;
  let finalPath = null;
  let error = null;
  let facts = null;
  try {
    const response = await page.goto(`${baseUrl}${url}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    status = response?.status() ?? null;
    await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
    await page.waitForTimeout(400);
    finalPath = new URL(page.url()).pathname;
    facts = await page.evaluate(() => {
      const text = document.body?.innerText ?? "";
      const h1 = document.querySelector("h1")?.textContent?.trim() ?? null;
      const flagged = [];
      const patterns = {
        "in build": /in build/i,
        "coming soon": /coming soon/i,
        "under construction": /under construction/i,
        "not live": /not live/i,
        lorem: /lorem/i,
        wakandi: /wakandi/i,
        todo: /\bTODO\b/,
      };
      for (const [name, pattern] of Object.entries(patterns)) {
        if (pattern.test(text)) flagged.push(name);
      }
      const backControl = [...document.querySelectorAll("a,button")].some((element) => {
        const label = (element.getAttribute("aria-label") ?? element.textContent ?? "").trim();
        return /^back$/i.test(label);
      });
      const emptyState = /\bNo [a-z ]+(yet|found|match)/i.test(text);
      return {
        title: document.title,
        h1,
        bodyChars: text.length,
        flagged,
        backControl,
        emptyState,
        tableRows: document.querySelectorAll("tbody tr").length,
        pagination: /\bPage \d+ of \d+|Next page|Previous page/i.test(text),
        nativeSelects: document.querySelectorAll("select").length,
        comboboxes: document.querySelectorAll('[role="combobox"]').length,
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
  } catch (caught) {
    error = caught.message.split("\n")[0].slice(0, 200);
  }

  results.push({
    route,
    requestedPath: url,
    linkedInSidebar: linked.has(route),
    status,
    finalPath,
    error,
    facts,
    consoleIssues: [...new Set(consoleIssues)],
    failedRequests: [...new Set(failedRequests)],
  });
  await page.close();
  process.stdout.write(`.`);
}

await context.close();
await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  viewport: "1280x800",
  mode: dynamicMode ? "dynamic" : "static",
  staticRoutes: routes.length,
  dynamicRoutesSkipped: dynamicRoutes,
  results,
};
const target = dynamicMode ? resolve(repoRoot, "docs/audit/route-crawl-dynamic.json") : outFile;
await mkdir(dirname(target), { recursive: true });
await writeFile(target, JSON.stringify(summary, null, 2));
console.log(`\nWrote ${results.length} route results to ${target}`);
