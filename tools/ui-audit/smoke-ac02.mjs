/**
 * AC-02 smoke test: walks the five-step wizard to a submitted application with a
 * document, then saves a second application as a draft. Fails on console errors.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const storageState = resolve(repoRoot, "artifacts/storage-state.json");
const workDir = resolve(repoRoot, "artifacts/smoke");
const baseUrl = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const apiUrl = process.env.AUDIT_API_URL ?? "http://localhost:4000";

const problems = [];
const consoleMessages = [];

function log(step, detail = "") {
  console.log(`${step}${detail ? ` — ${detail}` : ""}`);
}

// 1x1 PNG.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function fillFirstStep(page) {
  await page.getByRole("heading", { name: "New loan application" }).waitFor();
  const search = page.locator("#la-client-search");
  await search.click();
  await search.fill("CL-001");
  const option = page.getByRole("option").first();
  await option.waitFor({ timeout: 15000 });
  await option.click();

  const product = page.locator("#la-product");
  const productValue = await product.locator("option").nth(1).getAttribute("value");
  await product.selectOption(productValue);

  const range = await product.locator("xpath=../p").innerText();
  const minimum = range.split("–")[0].trim();
  await page.locator("#la-principal").fill(minimum.replace(/[^\d]/g, ""));

  const officer = page.locator("#la-officer");
  const officerValue = await officer.locator("option").nth(1).getAttribute("value");
  await officer.selectOption(officerValue);

  const sector = page.locator("#la-sector");
  const sectorValue = await sector.locator("option").nth(1).getAttribute("value");
  await sector.selectOption(sectorValue);

  return minimum;
}

async function main() {
  await mkdir(workDir, { recursive: true });
  const pngPath = resolve(workDir, "national-id.png");
  await writeFile(pngPath, png);

  const browser = await chromium.launch();
  const context = await browser.newContext({ storageState, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (failure) => consoleMessages.push(`pageerror: ${failure.message}`));

  // Submitted application with one document.
  await page.goto(`${baseUrl}/account-loan-application-create`, { waitUntil: "networkidle" });
  const principalLabel = await fillFirstStep(page);
  await page.getByTestId("wizard-next").click();

  await page.locator("#la-purpose").selectOption("Working capital");
  await page.getByTestId("wizard-next").click();

  await page.getByTestId("wizard-next").click();

  await page.getByRole("radio", { name: "Bank account" }).check();
  const bank = page.locator("#la-bank");
  const bankValue = await bank.locator("option").nth(1).getAttribute("value");
  await bank.selectOption(bankValue);
  await page.locator("#la-bank-name").fill("Acme Supplies Ltd");
  await page.locator("#la-bank-number").fill("0150123456789");
  await page.getByTestId("wizard-next").click();

  await page.locator("#la-documents").setInputFiles(pngPath);
  await page.getByText("national-id.png").waitFor();
  await page.getByRole("button", { name: "Submit application" }).click();

  await page.waitForURL(`${baseUrl}/account-loan-application`, { timeout: 30000 });
  const submittedText = await page.locator("body").innerText();
  const submittedMatch = submittedText.match(/Application (\d{6}) submitted/);
  const submittedNo = submittedMatch?.[1] ?? null;
  if (!submittedNo) problems.push("Submitted application number was not announced.");
  log("Submitted", submittedNo ?? "unknown");

  await page.getByRole("cell", { name: submittedNo, exact: true }).first().waitFor({ timeout: 20000 });

  // Draft application.
  await page.goto(`${baseUrl}/account-loan-application-create`, { waitUntil: "networkidle" });
  await fillFirstStep(page);
  for (let index = 0; index < 4; index += 1) {
    await page.getByTestId("wizard-next").click();
  }
  await page.getByRole("button", { name: "Save as draft" }).click();
  await page.waitForURL(`${baseUrl}/account-loan-application`, { timeout: 30000 });
  const draftText = await page.locator("body").innerText();
  const draftMatch = draftText.match(/Application (\d{6}) saved as a draft/);
  const draftNo = draftMatch?.[1] ?? null;
  if (!draftNo) problems.push("Draft application number was not announced.");
  log("Draft", draftNo ?? "unknown");

  const rows = page.locator("tbody tr");
  await rows.first().waitFor({ timeout: 20000 });
  const numbers = await rows.locator("td:first-child").allInnerTexts();
  if (submittedNo && !numbers.includes(submittedNo)) problems.push("Submitted row is missing from the list.");
  if (draftNo && !numbers.includes(draftNo)) problems.push("Draft row is missing from the list.");

  const statusOf = async (number) => {
    const row = rows.filter({ has: page.getByRole("cell", { name: number, exact: true }) });
    return (await row.locator("td").nth(6).innerText()).trim();
  };
  if (submittedNo && (await statusOf(submittedNo)) !== "Submitted") {
    problems.push(`Submitted row status is ${await statusOf(submittedNo)}.`);
  }
  if (draftNo && (await statusOf(draftNo)) !== "Draft") {
    problems.push(`Draft row status is ${await statusOf(draftNo)}.`);
  }
  log("List rows", numbers.slice(0, 4).join(", "));

  // View modal and document download.
  if (submittedNo) {
    const row = rows.filter({ has: page.getByRole("cell", { name: submittedNo, exact: true }) });
    await row.getByRole("button", { name: new RegExp(submittedNo) }).click();
    await page.getByRole("menuitem", { name: "View application" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    const detail = await dialog.innerText();
    for (const expected of [principalLabel, "Bank account", "1"]) {
      if (!detail.includes(expected)) problems.push(`View modal missing "${expected}".`);
    }
    await dialog.getByRole("button", { name: "Close" }).last().click();

    const list = await page.request.get(
      `${apiUrl}/settings/loan-applications?q=${encodeURIComponent(submittedNo)}`,
    );
    const payload = await list.json();
    const application = (payload.items ?? []).find((item) => item.applicationNo === submittedNo);
    const documentId = application?.documents?.[0]?.id;
    if (!documentId) {
      problems.push("Created application has no document metadata.");
    } else {
      const download = await page.request.get(
        `${apiUrl}/settings/loan-applications/${application.id}/documents/${documentId}`,
      );
      const type = download.headers()["content-type"] ?? "";
      const body = await download.body();
      if (download.status() !== 200) problems.push(`Document download returned ${download.status()}.`);
      if (!type.startsWith("image/png")) problems.push(`Document content-type is ${type}.`);
      if (body.length === 0) problems.push("Document download is empty.");
      log("Document", `${type}, ${body.length} bytes`);
    }
  }

  if (consoleMessages.length > 0) {
    problems.push(`Console: ${consoleMessages.join(" | ")}`);
  }

  await browser.close();

  if (problems.length > 0) {
    console.error("\nFAILED");
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }
  console.log("\nAll AC-02 smoke checks passed.");
}

main().catch((failure) => {
  console.error(failure);
  process.exit(1);
});
