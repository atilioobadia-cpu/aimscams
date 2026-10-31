// Capture script: logs in and takes full-page screenshots of all pages in pages.json
// Run: cd tools/ui-audit && node ../../ui-compare/capture.mjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '../..');
const PAGES = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/ui-compare/pages.json'), 'utf-8'));
const OUT_DIR = path.join(ROOT, 'artifacts/ui-screenshots');

function generateTOTP(secret) {
  const base32 = secret.replace(/=+$/, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of base32) bits += chars.indexOf(c).toString(2).padStart(5, '0');
  const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const counter = Math.floor(Date.now() / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return code.toString().padStart(6, '0');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1470, height: 833 },
    deviceScaleFactor: 1.25,
  });
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('#login-email', 'admin@aimscams.local');
  await page.fill('#login-password', 'Aimscams#2026');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/login/mfa', { timeout: 10000 });
  
  // MFA
  const totp = generateTOTP('U4KZARLLOTYGEN4WNLZ6MH4TG2PR6KHU');
  await page.fill('input[placeholder="000000"]', totp);
  await page.click('button:has-text("Verify and continue")');
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  console.log('Logged in. Capturing pages...');

  const only = process.argv[2];
  const targets = only ? PAGES.filter((p) => p.name === only) : PAGES;
  if (only && !targets.length) {
    console.log(`No page named ${only}`);
    await browser.close();
    process.exit(1);
  }

  let captured = 0;
  for (const p of targets) {
    const route = p.route;
    if (!route) continue;
    try {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(15000);
      await page.screenshot({ path: path.join(OUT_DIR, `${p.name}.png`), fullPage: true });
      captured++;
      if (captured % 10 === 0) console.log(`Captured ${captured}/${targets.length}`);
    } catch (e) {
      console.log(`Failed: ${p.name} - ${e.message}`);
    }
  }

  console.log(`Done. Captured ${captured} pages.`);
  await browser.close();
}

main().catch(console.error);