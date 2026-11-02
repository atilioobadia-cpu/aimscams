import { expect, test } from "../../tools/ui-audit/node_modules/playwright/test.mjs";

const scale = 1.5; // 1817px capture / 1211px CSS viewport
const css = (pixels: number) => pixels / scale;
const near = (actual: number, target: number, tolerance = 1) =>
  expect(Math.abs(actual - target)).toBeLessThanOrEqual(tolerance);
const box = (locator: any) => locator.evaluate((element: Element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
});

test.use({
  baseURL: process.env.AUDIT_BASE_URL ?? "http://localhost:3000",
  storageState: process.env.AUDIT_STORAGE_STATE ?? "artifacts/storage-state.json",
  viewport: { width: 1211, height: 614 },
  deviceScaleFactor: 1.5,
  expect: { timeout: 500 },
});

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  if (new URL(page.url()).pathname === "/login") {
    throw new Error("Dashboard parity assertions require an authenticated local storage state; this run was redirected to /login.");
  }
  await expect(page.getByTestId("dashboard-tab-card")).toBeVisible({ timeout: 1000 });
  await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute("data-state", "active");
});

test.describe("Round 4 Wakandi Dashboard parity", () => {
  test("1. Page shell and header match calibrated geometry and styling", async ({ page }) => {
    const header = await box(page.locator(".app-header"));
    near(header.height, 64.67);
    const main = await box(page.locator("#main-content"));
    near(main.x, 200);
    near(main.width, 1211 - 200);
    const first = await box(page.getByTestId("dashboard-tab-card"));
    near(first.x, css(320));
    near(first.y, css(118));
    const language = await page.getByTestId("language-trigger").evaluate((element) => {
      const label = [...element.querySelectorAll("span")].find((span) => span.textContent?.trim() === "English")!;
      const chevron = element.querySelectorAll("svg")[1]!;
      return {
        width: label.getBoundingClientRect().width,
        gap: chevron.getBoundingClientRect().left - label.getBoundingClientRect().right,
        color: getComputedStyle(label).color,
        weight: getComputedStyle(label).fontWeight,
      };
    });
    near(language.width, css(56));
    near(language.gap, css(35));
    expect(language.color).toBe("rgb(108, 117, 125)");
    expect(language.weight).toBe("400");
    const avatar = await page.getByTestId("header-avatar").evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(avatar).toContain("rgb(45, 120, 184)");
    expect(avatar).toContain("rgb(28, 79, 147)");
  });

  test("2. Dashboard tabs match reference dimensions, typography and iconography", async ({ page }) => {
    const card = await box(page.getByTestId("dashboard-tab-card"));
    near(card.width, css(1476));
    near(card.height, css(104));
    const overview = await box(page.getByTestId("dashboard-tab-overview"));
    near(overview.width, css(154));
    near(overview.height, css(43));
    expect(await page.getByTestId("dashboard-tab-overview").innerText()).toBe("Overview");
    expect(await page.getByTestId("dashboard-tab-members").innerText()).toBe("Members");
    expect(await page.getByTestId("dashboard-tab-loans").innerText()).toBe("Loans");
    const icons = await page.evaluate(() => ({
      overviewWeight: getComputedStyle(document.querySelector('[data-testid="dashboard-tab-overview"] span')!).fontWeight,
      membersIcon: document.querySelector('[data-testid="dashboard-tab-members"] svg')?.getAttribute("class") ?? "",
      loansIcon: document.querySelector('[data-testid="dashboard-tab-loans"] svg')?.getAttribute("class") ?? "",
      membersWidth: document.querySelector('[data-testid="dashboard-tab-members"] span')!.getBoundingClientRect().width,
      loansWidth: document.querySelector('[data-testid="dashboard-tab-loans"] span')!.getBoundingClientRect().width,
    }));
    expect(icons.overviewWeight).toBe("500");
    expect(icons.membersIcon).toContain("users-round");
    expect(icons.loansIcon).toContain("credit-card");
    near(icons.membersWidth, css(83));
    near(icons.loansWidth, css(55));
  });

  test("3. KPI cards match the 4-card layout, labels, values, badges and accents", async ({ page }) => {
    const cards = page.getByTestId("kpi-card");
    await expect(cards).toHaveCount(4);
    const metrics = await cards.evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      const label = element.querySelector("h3")!;
      const value = element.querySelector("p")!;
      const badge = element.querySelector('[data-testid="kpi-badge"]')!;
      const br = badge.getBoundingClientRect();
      return {
        x: rect.x, width: rect.width, height: rect.height,
        label: label.textContent?.trim(), labelColor: getComputedStyle(label).color,
        labelWeight: getComputedStyle(label).fontWeight,
        value: value.textContent?.trim(), valueSize: getComputedStyle(value).fontSize,
        badgeSize: br.width, badgeTop: br.top - rect.top, badgeRight: rect.right - br.right,
        ring: getComputedStyle(badge).borderTopWidth,
      };
    }));
    const starts = [320, 695, 1070, 1444].map(css);
    metrics.forEach((card, index) => {
      near(card.x, starts[index]);
      near(card.width, css(353));
      near(card.height, css(185));
      near(card.badgeSize, css(66));
      near(card.badgeTop, css(30));
      near(card.badgeRight, css(30));
      near(parseFloat(card.ring), css(2), 0.5);
      expect(card.labelColor).not.toBe("rgb(108, 117, 125)");
      expect(card.labelWeight).toBe("400");
      near(parseFloat(card.valueSize), css(32));
    });
    expect(metrics.map((card) => card.label)).toEqual([
      "Total Members", "Outstanding Loan Principal", "Principal in Arrears", "Clients in Arrears",
    ]);
    expect(metrics.map((card) => card.value)).toEqual(["1,111", "TZS 93,715,396", "TZS 16,180,416", "23"]);
  });

  test("4. Three chart cards use calibrated card, axis, value-label and legend styles", async ({ page }) => {
    const cards = page.locator('[data-testid="funds-chart"],[data-testid="savings-shares-loans-chart"],[data-testid="par-buckets-chart"]');
    await expect(cards).toHaveCount(3);
    const chartTech = await page.evaluate(() => ({
      svg: document.querySelectorAll('[data-testid="funds-chart"] svg,[data-testid="savings-shares-loans-chart"] svg,[data-testid="par-buckets-chart"] svg').length,
      canvas: document.querySelectorAll('[data-testid="funds-chart"] canvas,[data-testid="savings-shares-loans-chart"] canvas,[data-testid="par-buckets-chart"] canvas').length,
      divBars: document.querySelectorAll('[data-testid="funds-bar"],[data-testid="ssl-bar"],[data-testid="par-bar"]').length,
    }));
    expect(chartTech.divBars + chartTech.svg + chartTech.canvas).toBeGreaterThan(0);
    for (const card of await cards.all()) {
      const result = await card.evaluate((element) => {
        const heading = element.querySelector("h2")!;
        const style = getComputedStyle(element);
        return {
          height: element.getBoundingClientRect().height,
          radius: style.borderTopLeftRadius,
          titleSize: getComputedStyle(heading).fontSize,
          titleWeight: getComputedStyle(heading).fontWeight,
          titleLeft: heading.getBoundingClientRect().left - element.getBoundingClientRect().left,
        };
      });
      near(result.height, css(742));
      expect(result.radius).toBe(`${css(12)}px`);
      near(parseFloat(result.titleSize), css(22));
      expect(result.titleWeight).toBe("700");
      near(result.titleLeft, css(32));
    }
    const markers = await cards.locator("ul li span:first-child").evaluateAll((elements) => elements.map((element) => ({
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
      radius: getComputedStyle(element).borderRadius,
    })));
    expect(markers.every((marker) => marker.width === css(60) && marker.height === css(16) && marker.radius === "0px")).toBe(true);
    const legend = await cards.locator("ul").allTextContents();
    expect(legend.join(" ")).not.toMatch(/\d/);
    expect((await page.getByTestId("ssl-axis-tick").last().innerText()).trim()).toBe("TZS 0");
    expect((await page.getByTestId("par-axis-tick").last().innerText()).trim()).toBe("TZS 0");
  });

  test("5. Funds In and Funds Out have six months, reference values, grouped widths and axis scale", async ({ page }) => {
    const chart = page.getByTestId("funds-chart");
    expect(await chart.locator("h2").innerText()).toBe("FundsInVsFundsOut");
    near((await box(chart)).height, css(741));
    expect(await chart.getByTestId("funds-month-label").allTextContents()).toEqual(["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]);
    expect((await chart.getByTestId("funds-axis-tick").allTextContents()).map((value) => value.trim())).toEqual([
      "TZS 50M", "TZS 45M", "TZS 40M", "TZS 35M", "TZS 30M", "TZS 25M",
      "TZS 20M", "TZS 15M", "TZS 10M", "TZS 5M", "TZS 0",
    ]);
    const bars = await chart.getByTestId("funds-bar").evaluateAll((elements) => elements.map((element) => ({
      series: element.getAttribute("data-series"),
      period: element.getAttribute("data-period"),
      aria: element.getAttribute("aria-label"),
      width: element.getBoundingClientRect().width,
    })));
    expect(bars.map((bar) => bar.period + ":" + bar.series)).toEqual([
      "Jun:funds-in", "Jun:funds-out", "Jul:funds-in", "Jul:funds-out",
      "Aug:funds-in", "Sep:funds-in", "Oct:funds-in", "Oct:funds-out",
    ]);
    expect(bars.map((bar) => bar.aria)).toEqual([
      "Funds In, Jun June 2026: TZS 1,330,000", "Funds Out, Jun June 2026: TZS 3,590,000",
      "Funds In, Jul July 2026: TZS 1,980,000", "Funds Out, Jul July 2026: TZS 47,500,000",
      "Funds In, Aug August 2026: TZS 8,880,000", "Funds In, Sep September 2026: TZS 6,290,000",
      "Funds In, Oct October 2026: TZS 2,340,000", "Funds Out, Oct October 2026: TZS 47,500,000",
    ]);
    bars.forEach((bar) => near(bar.width, css(78)));
    expect((await chart.locator("ul").innerText()).replace(/\s+/g, " ").trim()).toBe("Funds In Funds Out");
  });

  test("6. Savings, Shares & Loans has the fixed 0–120M scale, categories and labels", async ({ page }) => {
    const chart = page.getByTestId("savings-shares-loans-chart");
    expect(await chart.locator("h2").innerText()).toBe("Total Savings, Shares & Loans");
    near((await box(chart)).width, css(726));
    near((await box(chart)).height, css(742));
    expect((await chart.getByTestId("ssl-axis-tick").allTextContents()).map((value) => value.trim())).toEqual([
      "TZS 120M", "TZS 100M", "TZS 80M", "TZS 60M", "TZS 40M", "TZS 20M", "TZS 0",
    ]);
    expect(await chart.getByTestId("ssl-category").allTextContents()).toEqual(["Savings", "Shares", "Loans"]);
    const bars = await chart.getByTestId("ssl-bar").evaluateAll((elements) => elements.map((element) => ({
      series: element.getAttribute("data-series"),
      label: element.querySelector('[data-testid="ssl-value-label"]')?.textContent?.trim(),
      width: element.getBoundingClientRect().width,
    })));
    expect(bars.map((bar) => bar.series)).toEqual(["savings", "shares", "loans"]);
    expect(bars.map((bar) => bar.label)).toEqual(["", "", "115.33M"]);
    bars.forEach((bar) => near(bar.width, css(127)));
    expect((await chart.locator("ul").innerText()).replace(/\s+/g, " ").trim()).toBe("Savings Shares Loans");
  });

  test("7. PAR chart has a fixed scale, reference buckets, colors, labels and two-row legend", async ({ page }) => {
    const chart = page.getByTestId("par-buckets-chart");
    expect(await chart.locator("h2").innerText()).toBe("Risk Snapshot: PAR Buckets");
    near((await box(chart)).width, css(726));
    near((await box(chart)).height, css(742));
    expect((await chart.getByTestId("par-axis-tick").allTextContents()).map((value) => value.trim())).toEqual([
      "TZS 50M", "TZS 45M", "TZS 40M", "TZS 35M", "TZS 30M", "TZS 25M",
      "TZS 20M", "TZS 15M", "TZS 10M", "TZS 5M", "TZS 0",
    ]);
    const bars = await chart.getByTestId("par-bar").evaluateAll((elements) => elements.map((element) => ({
      series: element.getAttribute("data-series"),
      label: element.querySelector('[data-testid="par-value-label"]')?.textContent?.trim(),
      width: element.getBoundingClientRect().width,
      color: getComputedStyle(element).backgroundColor,
    })));
    expect(bars.map((bar) => bar.series)).toEqual(["current", "1-30", "31-90", "90+"]);
    expect(bars.map((bar) => bar.label)).toEqual(["50M", "13.79M", "25.29M", "4.64M"]);
    expect(bars.map((bar) => bar.color)).toEqual(["rgb(5, 117, 115)", "rgb(230, 192, 30)", "rgb(200, 90, 68)", "rgb(169, 58, 43)"]);
    bars.forEach((bar) => near(bar.width, css(98)));
    expect(await chart.getByTestId("par-category").allTextContents()).toEqual(["Current", "1-30 Days", "31-90 Days", "90+ Days"]);
    expect(await chart.locator("ul li").count()).toBe(4);
  });

  test("8. Hover tooltips show a category title, series swatch, full TZS amount and saturated bar", async ({ page }) => {
    const loans = page.locator('[data-testid="ssl-bar"][data-series="loans"]');
    await loans.hover();
    let tooltip = page.getByRole("tooltip");
    await expect(tooltip).toContainText("Loans");
    await expect(tooltip).toContainText("Loans: TZS 115,325,000");
    await expect(tooltip.getByTestId("tooltip-swatch")).toHaveCount(1);
    expect(await loans.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(220, 58, 26)");
    await page.locator('[data-testid="funds-bar"]').first().hover();
    tooltip = page.getByRole("tooltip");
    await expect(tooltip).toContainText("Jun");
    await expect(tooltip).toContainText("Funds In: TZS 1,330,000");
    await page.locator('[data-testid="par-bar"][data-series="1-30"]').hover();
    tooltip = page.getByRole("tooltip");
    await expect(tooltip).toContainText("1-30 Days");
    await expect(tooltip).toContainText("1-30 Days: TZS 13,790,000");
  });

  test("9. Labels use integer-safe compact formatting and chart 1 is ledger-backed", async ({ page }) => {
    expect(await page.getByTestId("funds-value-label").allTextContents()).toEqual([
      "1.33M", "3.59M", "1.98M", "47.5M", "8.88M", "6.29M", "2.34M", "47.5M",
    ]);
    expect(await page.getByTestId("ssl-value-label").allTextContents()).toEqual(["", "", "115.33M"]);
    expect(await page.getByTestId("par-value-label").allTextContents()).toEqual(["50M", "13.79M", "25.29M", "4.64M"]);
    expect(await page.getByTestId("funds-chart").getAttribute("data-source")).toBe("ledger");
  });

  test("10. Dashboard content ends with the measured white 38px strip", async ({ page }) => {
    const strip = page.getByTestId("dashboard-bottom-strip");
    await expect(strip).toBeVisible();
    const value = await strip.evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      width: element.getBoundingClientRect().width,
      background: getComputedStyle(element).backgroundColor,
      border: getComputedStyle(element).borderTopWidth,
    }));
    near(value.height, css(38));
    near(value.width, css(1476));
    expect(value.background).toBe("rgb(255, 255, 255)");
    expect(value.border).toBe("1px");
  });

  test("11. Sidebar groups, geometry, icons, scroll, active pill and footer match", async ({ page }) => {
    await expect(page.locator('[data-testid="nav-group"][data-nav-label="Accounts"]')).toHaveAttribute("data-expanded", "false");
    const nav = await page.getByTestId("app-sidebar").evaluate((sidebar) => {
      const rect = (element: Element) => element.getBoundingClientRect();
      const chevrons = [...sidebar.querySelectorAll('[data-testid="nav-group"] button[aria-label^="Expand"],[data-testid="nav-group"] button[aria-label^="Collapse"]')].map(rect).map((value) => value.left);
      const campaigns = sidebar.querySelector('[data-nav-label="Campaigns"]')!;
      const reports = sidebar.querySelector('[data-nav-label="Reports"]')!;
      const active = sidebar.querySelector('[aria-current="page"]')!;
      const list = sidebar.querySelector(".sidebar-scroll")!;
      const footer = sidebar.querySelector('[data-testid="sidebar-footer"]')!;
      return {
        height: rect(sidebar).height, width: rect(sidebar).width, chevrons,
        campaignsReportsGap: rect(reports).top - rect(campaigns).bottom,
        activeInset: rect(sidebar).right - rect(active).right,
        overflow: getComputedStyle(list).overflowY,
        labels: getComputedStyle(sidebar.querySelector('[data-nav-label="Business Account"] span')!).fontSize,
        businessLabelWidth: rect(sidebar.querySelector('[data-nav-label="Business Account"] span')!).width,
        icons: ["Accounts", "Transactions", "Requests", "Messages", "Client", "Campaigns", "Business Account"].map((label) =>
          sidebar.querySelector('[data-nav-label="' + label + '"] svg')?.getAttribute("class") ?? ""),
        footerText: footer.innerText,
        wordmarkWidth: rect(footer.querySelector(".sidebar-footer-wordmark")!).width,
      };
    });
    near(nav.height, 614 - 64.67);
    near(nav.width, 200);
    expect(Math.max(...nav.chevrons) - Math.min(...nav.chevrons)).toBeLessThanOrEqual(1);
    near(nav.campaignsReportsGap, css(59));
    expect(nav.activeInset).toBeGreaterThanOrEqual(css(8));
    expect(nav.overflow).toBe("auto");
    near(nav.businessLabelWidth, css(160));
    for (const name of ["briefcase", "banknote", "mail", "message-circle-search", "users-round", "grid-2x2"]) expect(nav.icons.join(" ")).toContain(name);
    expect(nav.footerText).toContain("AIMSCAMS");
    expect(nav.footerText).not.toMatch(/Wakandi/i);
    near(nav.wordmarkWidth, css(121));
  });
});

