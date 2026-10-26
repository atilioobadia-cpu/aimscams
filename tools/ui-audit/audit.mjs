import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.env.AUDIT_URL ?? "http://localhost:3000/dashboard";
const viewport = {
  width: Number(process.env.AUDIT_WIDTH ?? 1837),
  height: Number(process.env.AUDIT_HEIGHT ?? 1000),
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport });
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

await page.goto(url, { waitUntil: "networkidle" });

const measure = async (selector) => {
  const box = await page.locator(selector).first().boundingBox();
  return box ? { width: Math.round(box.width), height: Math.round(box.height) } : null;
};

const report = {
  url,
  viewport,
  header: await measure('[data-testid="app-header"]'),
  sidebar: await measure('[data-testid="app-sidebar"]'),
  navItems: await page.locator('[data-testid="app-sidebar"] nav a, [data-testid="app-sidebar"] nav button').count(),
  consoleErrors,
};

await mkdir("artifacts", { recursive: true });
await page.screenshot({ path: "artifacts/ui-audit.png", fullPage: true });
await browser.close();

console.log(JSON.stringify(report, null, 2));

if (consoleErrors.length > 0) process.exitCode = 1;
