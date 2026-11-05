import { expect, test } from "../../tools/ui-audit/node_modules/playwright/test.mjs";

test.use({
  baseURL: process.env.AUDIT_BASE_URL ?? "http://localhost:3000",
  storageState: process.env.AUDIT_STORAGE_STATE ?? "artifacts/storage-state.json",
  viewport: { width: 1280, height: 720 },
  expect: { timeout: 5000 },
});

test.beforeEach(async ({ page }) => {
  await page.goto("/settings-service-provider", { waitUntil: "domcontentloaded" });
  if (new URL(page.url()).pathname === "/login") {
    throw new Error("Services parity assertions require an authenticated local storage state.");
  }
});

test.describe("Settings services parity", () => {
  test("page renders without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
    await expect(page.getByTestId("app-sidebar")).toBeVisible();
    await expect(page.locator('[data-parity="page-card"]')).toBeVisible();
  });

  test("sidebar settings group is expanded with services active", async ({ page }) => {
    const group = page.locator('li[data-nav-label="Settings"]');
    await expect(group).toHaveAttribute("data-expanded", "true");
    const active = group.locator('a[data-active="true"]');
    await expect(active).toContainText("Services");
  });
});
