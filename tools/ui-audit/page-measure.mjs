/**
 * Phase 3 renderer measurement.
 *
 * Visits every route in docs/audit/reference-map.json (dynamic patterns are resolved
 * from the Phase 1 dynamic crawl), records shell geometry, typography, palette,
 * table/form structure and masked text, and writes one JSON file per route under
 * artifacts/page-measure/ plus index.json.
 *
 * Env: AUDIT_BASE_URL, AUDIT_STORAGE_STATE, MEASURE_ONLY (comma-separated routes).
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const baseUrl = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const storageState = process.env.AUDIT_STORAGE_STATE
  ? resolve(process.env.AUDIT_STORAGE_STATE)
  : resolve(repoRoot, "artifacts/storage-state.json");
const outDir = resolve(repoRoot, "artifacts/page-measure");
const mapFile = resolve(repoRoot, "docs/audit/reference-map.json");
const dynamicCrawl = resolve(repoRoot, "docs/audit/route-crawl-dynamic.json");
const viewport = { width: 1280, height: 800 };

if (!existsSync(storageState)) {
  console.error(`Missing storage state: ${storageState}`);
  process.exit(2);
}

const mapping = JSON.parse(await readFile(mapFile, "utf8"));
const dynamic = JSON.parse(await readFile(dynamicCrawl, "utf8")).results;
const resolvedDynamic = new Map(dynamic.map((row) => [row.route, row.finalPath]));

/** Reference slug -> concrete path. */
const targets = [];
for (const [slug, entry] of Object.entries(mapping)) {
  if (!entry.route) continue;
  const path = entry.route.includes("[") ? resolvedDynamic.get(entry.route) : entry.route;
  if (!path) {
    console.error(`No concrete path for ${entry.route}`);
    continue;
  }
  targets.push({ slug, route: entry.route, path });
}

const only = (process.env.MEASURE_ONLY ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const selected = only.length ? targets.filter((t) => only.includes(t.route) || only.includes(t.slug)) : targets;

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ storageState, viewport, deviceScaleFactor: 1 });
const page = await context.newPage();

const index = [];
for (const target of selected) {
  const consoleIssues = [];
  const failedRequests = [];
  const onConsole = (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleIssues.push(`${message.type()}: ${message.text()}`.slice(0, 400));
    }
  };
  const onPageError = (error) => consoleIssues.push(`pageerror: ${error.message}`.slice(0, 400));
  const onResponse = (response) => {
    if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`);
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);

  let measured = null;
  let status = null;
  try {
    const response = await page.goto(`${baseUrl}${target.path}`, {
      waitUntil: "networkidle",
      timeout: 45000,
    });
    status = response?.status() ?? null;
    await page.waitForTimeout(350);
    measured = await page.evaluate(measurePage);
  } catch (error) {
    measured = { error: String(error).slice(0, 300) };
  }

  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  page.off("response", onResponse);

  const record = {
    slug: target.slug,
    route: target.route,
    path: target.path,
    status,
    finalPath: new URL(page.url()).pathname,
    consoleIssues,
    failedRequests,
    ...measured,
  };
  const fileName = target.slug.replace(/[\\/:*?"<>|]/g, "_");
  await writeFile(resolve(outDir, `${fileName}.json`), JSON.stringify(record, null, 2), "utf8");
  index.push({
    slug: target.slug,
    route: target.route,
    path: target.path,
    status,
    h1: record.h1 ?? null,
    placeholder: record.placeholder ?? false,
    tableCount: record.tables?.length ?? 0,
    consoleIssues: consoleIssues.length,
    failedRequests: failedRequests.length,
    error: record.error ?? null,
  });
  console.log(`${target.slug} ${status} h1=${record.h1 ?? "-"} tables=${record.tables?.length ?? 0}${record.placeholder ? " PLACEHOLDER" : ""}`);
}

await browser.close();
await writeFile(resolve(outDir, "index.json"), JSON.stringify(index, null, 2), "utf8");
console.log(`measured ${index.length} routes`);

/**
 * Runs in the browser. Everything here must be self-contained.
 */
function measurePage() {
  const MASK = (text) =>
    text
      .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
      .replace(/\+?\d[\d\s().-]{7,}\d/g, (match) => (/^\d{4}-\d{2}-\d{2}/.test(match) ? match : "[number]"))
      .replace(/\b\d{10,}\b/g, "[id]");

  const box = (node) => {
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
    };
  };
  const style = (node, props) => {
    if (!node) return null;
    const computed = getComputedStyle(node);
    const out = {};
    for (const prop of props) out[prop] = computed[prop];
    return out;
  };
  const visible = (node) => {
    if (!node) return false;
    const rect = node.getBoundingClientRect();
    const computed = getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && computed.visibility !== "hidden" && computed.display !== "none";
  };
  const text = (node) => (node?.innerText ?? "").replace(/\s+/g, " ").trim();
  const toHex = (value) => {
    const match = /rgba?\(([^)]+)\)/.exec(value ?? "");
    if (!match) return value ?? null;
    const parts = match[1].split(",").map((part) => Number.parseFloat(part));
    const [r, g, b, a = 1] = parts;
    if (a === 0) return "transparent";
    return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
  };

  const header = document.querySelector('[data-testid="app-header"]');
  const sidebar = document.querySelector('[data-testid="app-sidebar"]');
  const main = document.querySelector("main") ?? document.querySelector('[role="main"]');
  const h1 = document.querySelector("h1");

  const content = main ?? document.body;
  const allText = text(content);
  const placeholder = /\bin build\b/i.test(allText) || /\bcoming soon\b/i.test(allText);

  // Tables
  // Page-header actions sit on the same line as the title, to the right of it.
  const h1Rect = h1 ? h1.getBoundingClientRect() : null;
  const pageActions = h1Rect
    ? [...content.querySelectorAll("button, a")]
        .filter((candidate) => {
          if (!visible(candidate) || candidate.contains(h1)) return false;
          const rect = candidate.getBoundingClientRect();
          const sameLine = Math.abs(rect.top - h1Rect.top) < 28;
          return sameLine && rect.left > h1Rect.right - 4;
        })
        .map((candidate) => text(candidate))
        .filter(Boolean)
    : [];

  const paginationNode =
    content.querySelector('[data-slot="pagination"]') ??
    content.querySelector('nav[aria-label*="pagination" i]');

  const tables = [...content.querySelectorAll("table")].slice(0, 4).map((table) => {
    const headerRow = table.querySelector("thead tr") ?? table.querySelector("tr");
    const headers = headerRow ? [...headerRow.querySelectorAll("th")].map((th) => text(th)) : [];
    const firstBodyRow = table.querySelector("tbody tr");
    const cells = firstBodyRow ? [...firstBodyRow.querySelectorAll("td")].map((td) => text(td).slice(0, 40)) : [];
    const headerCell = table.querySelector("thead th");
    return {
      headers,
      columns: headers.length,
      rows: table.querySelectorAll("tbody tr").length,
      box: box(table),
      headerStyle: style(headerCell, ["backgroundColor", "color", "fontSize", "fontWeight", "textTransform", "paddingTop", "paddingBottom", "borderBottomColor", "borderBottomWidth"]),
      cellStyle: style(firstBodyRow?.querySelector("td"), ["paddingTop", "paddingBottom", "fontSize", "color", "borderBottomColor"]),
      rowHeight: firstBodyRow ? Math.round(firstBodyRow.getBoundingClientRect().height) : null,
      sampleCells: cells,
    };
  });

  // Forms and filters
  const controls = [...content.querySelectorAll("input, select, textarea")].filter(visible);
  const forms = {
    inputs: controls.filter((node) => node.tagName === "INPUT").length,
    selects: controls.filter((node) => node.tagName === "SELECT").length,
    textareas: controls.filter((node) => node.tagName === "TEXTAREA").length,
    comboboxes: content.querySelectorAll('[role="combobox"]').length,
    placeholders: [...new Set(controls.map((node) => node.getAttribute("placeholder") ?? "").filter(Boolean))].slice(0, 12),
    labels: [...new Set([...content.querySelectorAll("label")].map((node) => text(node)).filter(Boolean))].slice(0, 40),
  };

  // Buttons and links
  const buttons = [...new Set([...content.querySelectorAll("button, [role=\"button\"], a[class*=\"btn\"]")].filter(visible).map((node) => text(node)).filter(Boolean))].slice(0, 40);
  const primaryButton = [...content.querySelectorAll("button")].find((node) => {
    if (!visible(node)) return false;
    const bg = toHex(getComputedStyle(node).backgroundColor);
    return bg === "#057573" || bg === "#047674";
  });

  const tabs = [...content.querySelectorAll('[role="tab"]')].filter(visible).map((node) => text(node));
  const links = [...new Set([...content.querySelectorAll("a")].filter(visible).map((node) => text(node)).filter(Boolean))].slice(0, 30);

  // Typography histogram
  const fontSizes = {};
  const colours = {};
  for (const node of content.querySelectorAll("h1,h2,h3,p,span,td,th,label,a,button")) {
    if (!visible(node) || !text(node)) continue;
    const computed = getComputedStyle(node);
    const size = computed.fontSize;
    fontSizes[size] = (fontSizes[size] ?? 0) + 1;
    const colour = toHex(computed.color);
    colours[colour] = (colours[colour] ?? 0) + 1;
  }
  const top = (object, count = 8) =>
    Object.entries(object)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([value, hits]) => ({ value, hits }));

  const navItems = [...document.querySelectorAll('[data-testid="nav-item"], [data-testid="nav-subitem"]')];
  const activeNav = navItems.find((node) => /active|current/i.test(node.getAttribute("aria-current") ?? "") || /true/.test(node.getAttribute("data-active") ?? ""));

  const bodyStyle = getComputedStyle(document.body);
  return {
    title: document.title,
    h1: text(h1) || null,
    h1Box: box(h1),
    h1Style: style(h1, ["fontSize", "fontWeight", "color", "lineHeight", "letterSpacing", "fontFamily"]),
    breadcrumb: text(document.querySelector('[aria-label="breadcrumb"], nav[aria-label*="readcrumb" i]')),
    placeholder,
    shell: {
      header: { ...box(header), ...style(header, ["position", "backgroundColor", "borderBottomColor", "borderBottomWidth", "padding", "boxShadow", "height"]) },
      sidebar: { ...box(sidebar), ...style(sidebar, ["position", "backgroundColor", "borderRightColor", "borderRightWidth", "width"]) },
      main: { ...box(main), ...style(main, ["backgroundColor", "paddingTop", "paddingLeft", "paddingRight"]) },
      doc: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth },
    },
    bodyStyle: { fontFamily: bodyStyle.fontFamily, fontSize: bodyStyle.fontSize, color: toHex(bodyStyle.color), lineHeight: bodyStyle.lineHeight },
    tables,
    forms,
    buttons,
    primaryButtonStyle: style(primaryButton, ["height", "backgroundColor", "color", "borderRadius", "paddingLeft", "paddingRight", "fontSize", "fontWeight", "borderWidth"]),
    tabs,
    links,
    nav: {
      activeLabel: text(activeNav) || null,
      activeStyle: style(activeNav, ["backgroundColor", "color", "fontWeight", "borderRadius", "height"]),
      labels: navItems.map((node) => text(node)).filter(Boolean),
    },
    fontSizes: top(fontSizes),
    colours: top(colours),
    pagination: paginationNode ? text(paginationNode) : "",
    paginationItems: paginationNode ? [...paginationNode.querySelectorAll("a, button")].map((node) => text(node)).filter(Boolean) : [],
    pageActions,
    sectionHeadings: [...content.querySelectorAll("h2, h3")].filter(visible).map((node) => text(node)).filter(Boolean).slice(0, 20),
    isEmpty: Boolean(paginationNode) && (tables[0]?.rows ?? 0) === 0,
    emptyState: (allText.match(/no (?:data|records|results|transactions|entries)[^.]{0,80}/i) ?? [null])[0],
    text: MASK(allText).slice(0, 6000),
    textLength: allText.length,
  };
}
