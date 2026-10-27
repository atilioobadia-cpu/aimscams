/**
 * Creates a Playwright storage state for the UI audit.
 *
 * The back office requires a password plus a TOTP challenge, so the audit cannot
 * reuse a browser profile from another session. This helper performs the real
 * login once and writes cookies/localStorage to disk.
 *
 * Required environment:
 *   AUDIT_EMAIL          admin email
 *   AUDIT_PASSWORD       admin password
 *   AUDIT_MFA_SECRET     base32 TOTP secret (only needed when MFA is challenged)
 *
 * Optional:
 *   AUDIT_BASE_URL       default http://localhost:3000
 *   AUDIT_STORAGE_STATE  default <repo>/artifacts/storage-state.json
 *   AUDIT_HEADLESS       default true; set "false" to watch the flow
 */
import { createHmac } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const artifactsDir = resolve(repoRoot, "artifacts");
const baseUrl = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const output = process.env.AUDIT_STORAGE_STATE
  ? resolve(process.env.AUDIT_STORAGE_STATE)
  : resolve(artifactsDir, "storage-state.json");
const email = process.env.AUDIT_EMAIL;
const password = process.env.AUDIT_PASSWORD;
const mfaSecret = process.env.AUDIT_MFA_SECRET;
const headless = process.env.AUDIT_HEADLESS !== "false";

if (!email || !password) {
  console.error("AUDIT_EMAIL and AUDIT_PASSWORD are required.");
  process.exit(2);
}

function decodeBase32(input) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = input.replace(/[\s-]/g, "").toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const character of clean) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error(`Invalid base32 character: ${character}`);
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function totp(secret, step = 0) {
  const key = decodeBase32(secret);
  const counter = Math.floor(Date.now() / 30_000) + step;
  const message = Buffer.alloc(8);
  message.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  message.writeUInt32BE(counter >>> 0, 4);
  const digest = createHmac("sha1", key).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 1_000_000).padStart(6, "0");
}

const secondsIntoStep = Math.floor((Date.now() / 1000) % 30);
if (secondsIntoStep > 24) {
  const wait = 30 - secondsIntoStep + 1;
  console.log(`Waiting ${wait}s for a fresh TOTP window.`);
  await new Promise((resolveWait) => setTimeout(resolveWait, wait * 1000));
}

const browser = await chromium.launch({ headless });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1_200);
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);

  const login = async () => {
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await page.waitForURL(
      (url) => url.pathname === "/login/mfa" || !url.pathname.startsWith("/login"),
      { timeout: 12_000 },
    );
  };

  try {
    await login();
  } catch {
    // A cold dev server can still be hydrating when the first fill and click
    // land; React then resets the uncontrolled inputs and the native submit
    // sends empty credentials. Wait, refill and retry once.
    await page.waitForTimeout(1_500);
    await page.locator("#login-email").fill(email);
    await page.locator("#login-password").fill(password);
    await login();
  }

  if (new URL(page.url()).pathname.startsWith("/login/mfa")) {
    if (!mfaSecret) throw new Error("MFA is challenged but AUDIT_MFA_SECRET is not set.");
    await page.locator("#mfa-code").waitFor();
    await page.waitForTimeout(800);

    let verified = false;
    for (let attempt = 0; attempt < 2 && !verified; attempt += 1) {
      await page.locator("#mfa-code").fill(totp(mfaSecret));
      await page.waitForTimeout(150);
      await page.getByRole("button", { name: "Verify and continue", exact: true }).click();
      try {
        await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
          timeout: 10_000,
        });
        verified = true;
      } catch {
        const error = await page.locator("#mfa-code-error").textContent().catch(() => "");
        console.warn(
          `MFA attempt ${attempt + 1} failed at ${new URL(page.url()).pathname}${error ? `: ${error.trim()}` : "."}`,
        );
        if (attempt === 0) {
          const secondsIntoStep = Math.floor((Date.now() / 1000) % 30);
          const wait = 30 - secondsIntoStep + 1;
          await new Promise((resolveWait) => setTimeout(resolveWait, wait * 1000));
        }
      }
    }
    if (!verified) {
      await mkdir(artifactsDir, { recursive: true });
      await page.screenshot({ path: resolve(artifactsDir, "login-failure.png") });
      throw new Error("MFA verification failed twice.");
    }
  }

  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);

  await mkdir(dirname(output), { recursive: true });
  await context.storageState({ path: output });
  console.log(`Storage state written to ${output}`);
  console.log(`Authenticated as ${email}; landed on ${new URL(page.url()).pathname}.`);
} finally {
  await context.close();
  await browser.close();
}
