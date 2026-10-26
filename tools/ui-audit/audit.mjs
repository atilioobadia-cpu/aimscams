import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.env.AUDIT_URL ?? "http://localhost:3000/dashboard";
const viewports = [
  { width: 1837, height: 1080 },
  { width: 1280, height: 800 },
];

const NAV_ORDER = [
  "Dashboard",
  "Client",
  "Accounts",
  "Transactions",
  "Accounting",
  "Requests",
  "Messages",
  "Campaigns",
  "Reports",
  "Import",
  "Business Account",
  "Settings",
];

const CHEVRON_ITEMS = [
  "Accounts",
  "Transactions",
  "Accounting",
  "Campaigns",
  "Reports",
  "Import",
  "Settings",
];

const checks = [];
const failures = [];

function check(name, pass, detail = {}) {
  const entry = { name, pass: Boolean(pass), detail };
  checks.push(entry);
  if (!pass) failures.push(entry);
}

function equal(name, actual, expected) {
  check(name, JSON.stringify(actual) === JSON.stringify(expected), { actual, expected });
}

function near(name, actual, expected, tolerance = 1) {
  check(name, Math.abs(actual - expected) <= tolerance, { actual, expected, tolerance });
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function box(value) {
  return value
    ? {
        x: round(value.x),
        y: round(value.y),
        w: round(value.width),
        h: round(value.height),
      }
    : null;
}

async function boxOf(locator) {
  if ((await locator.count()) === 0) return null;
  return box(await locator.first().boundingBox());
}

async function styleOf(locator, properties) {
  return locator.first().evaluate((element, names) => {
    const style = getComputedStyle(element);
    return Object.fromEntries(names.map((name) => [name, style[name]]));
  }, properties);
}

async function activeElement(page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    return {
      testId: element?.getAttribute("data-testid") ?? null,
      role: element?.getAttribute("role") ?? null,
      tag: element?.tagName ?? null,
      text: element?.textContent?.trim() ?? null,
    };
  });
}

async function pageOverflow(page) {
  return page.evaluate(() => {
    const client = document.documentElement.clientWidth;
    const offenders = [];
    for (const element of document.querySelectorAll("body *")) {
      const rect = element.getBoundingClientRect();
      if (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.right > client + 1 &&
        getComputedStyle(element).position !== "fixed"
      ) {
        offenders.push({
          tag: element.tagName,
          testId: element.getAttribute("data-testid"),
          className: element.className?.toString().slice(0, 80),
          right: Math.round(rect.right),
        });
      }
    }
    return {
      client,
      scroll: document.documentElement.scrollWidth,
      bodyScroll: document.body.scrollWidth,
      offenders: offenders.slice(0, 8),
    };
  });
}

async function waitForGone(locator, timeout = 1500) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (!(await locator.isVisible().catch(() => false))) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
}

await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { url, viewports: {}, checks, failures };

for (const viewport of viewports) {
  const key = `${viewport.width}x${viewport.height}`;
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();

  const consoleErrors = [];
  const badResponses = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      badResponses.push({ status: response.status(), url: response.url() });
    }
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(150);

  const prefix = `[${key}]`;
  const viewportW = viewport.width;
  const viewportH = viewport.height;

  // ---- Shell -----------------------------------------------------------
  const header = await boxOf(page.getByTestId("app-header"));
  const headerStyle = await styleOf(page.getByTestId("app-header"), [
    "backgroundColor",
    "borderBottomWidth",
    "borderBottomColor",
    "position",
  ]);
  check(`${prefix} header height is 97`, header && Math.abs(header.h - 97) <= 1, header);
  check(`${prefix} header spans viewport`, header && header.x === 0 && header.w === viewportW, {
    header,
    viewportW,
  });
  equal(`${prefix} header background`, headerStyle.backgroundColor, "rgb(255, 255, 255)");
  equal(`${prefix} header bottom border`, headerStyle.borderBottomWidth, "1px");
  equal(
    `${prefix} header bottom border colour`,
    headerStyle.borderBottomColor,
    "rgb(222, 226, 230)",
  );
  equal(`${prefix} header is fixed`, headerStyle.position, "fixed");

  const tenantLogo = await boxOf(page.getByTestId("tenant-logo"));
  const avatar = await boxOf(page.getByTestId("header-avatar"));
  const flag = await boxOf(page.getByTestId("tanzania-flag"));
  const avatarCount = await page.getByTestId("header-avatar").count();
  check(
    `${prefix} tenant circle is 60px`,
    tenantLogo && Math.abs(tenantLogo.w - 60) <= 1 && Math.abs(tenantLogo.h - 60) <= 1,
    tenantLogo,
  );
  check(
    `${prefix} avatar is 50px`,
    avatar && Math.abs(avatar.w - 50) <= 1 && Math.abs(avatar.h - 50) <= 1,
    avatar,
  );
  check(
    `${prefix} Tanzania flag is 38x24`,
    flag && Math.abs(flag.w - 38) <= 1 && Math.abs(flag.h - 24) <= 1,
    flag,
  );
  equal(`${prefix} one user block in header`, avatarCount, 1);

  const languageTrigger = page.getByTestId("language-trigger");
  const branchContext = page.getByTestId("branch-context");
  const userTrigger = page.getByTestId("user-menu-trigger");
  const userName = page.getByTestId("header-user-name");
  check(`${prefix} branch context visible`, await branchContext.isVisible(), {});
  check(`${prefix} user name visible`, await userName.isVisible(), {});
  const languageBox = await boxOf(languageTrigger);
  const branchBox = await boxOf(branchContext);
  const userBox = await boxOf(userTrigger);
  check(
    `${prefix} header groups do not overlap`,
    languageBox &&
      branchBox &&
      userBox &&
      languageBox.x + languageBox.w <= branchBox.x + 1 &&
      branchBox.x + branchBox.w <= userBox.x + 1,
    { languageBox, branchBox, userBox },
  );
  check(
    `${prefix} header group stays inside viewport`,
    userBox && userBox.x + userBox.w <= viewportW,
    { userBox, viewportW },
  );

  const bodyBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  equal(`${prefix} page background`, bodyBackground, "rgb(235, 233, 233)");

  // ---- Sidebar ---------------------------------------------------------
  const sidebar = await boxOf(page.getByTestId("app-sidebar"));
  const sidebarStyle = await styleOf(page.getByTestId("app-sidebar"), [
    "backgroundColor",
    "borderRightWidth",
    "borderRightColor",
    "position",
  ]);
  check(
    `${prefix} sidebar is 300px below header`,
    sidebar &&
      sidebar.w === 300 &&
      sidebar.x === 0 &&
      Math.abs(sidebar.y - 97) <= 1 &&
      Math.abs(sidebar.h - (viewportH - 97)) <= 1,
    sidebar,
  );
  equal(`${prefix} sidebar background`, sidebarStyle.backgroundColor, "rgb(255, 255, 255)");
  equal(`${prefix} sidebar right border`, sidebarStyle.borderRightWidth, "1px");
  equal(
    `${prefix} sidebar right border colour`,
    sidebarStyle.borderRightColor,
    "rgb(222, 226, 230)",
  );
  equal(`${prefix} sidebar is fixed`, sidebarStyle.position, "fixed");

  const navItems = page.locator('[data-testid="nav-item"]');
  equal(`${prefix} sidebar has 12 items`, await navItems.count(), 12);
  equal(
    `${prefix} nav order`,
    await navItems.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-nav-label")),
    ),
    NAV_ORDER,
  );

  const navBoxes = await navItems.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      const icon = element.querySelector("svg")?.getBoundingClientRect();
      const chevron = element.querySelector("svg.lucide-chevron-down")?.getBoundingClientRect();
      return {
        label: element.getAttribute("data-nav-label"),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        iconX: icon ? Math.round(icon.x) : null,
        iconW: icon ? Math.round(icon.width) : null,
        chevronX: chevron ? Math.round(chevron.x) : null,
        chevronW: chevron ? Math.round(chevron.width) : null,
        text: element.textContent?.trim(),
      };
    }),
  );
  const pitches = navBoxes.slice(1).map((item, index) => item.y - navBoxes[index].y);
  check(
    `${prefix} nav pitch is 60px`,
    pitches.every((pitch) => pitch === 60),
    pitches,
  );
  check(
    `${prefix} nav icons are 20px at x=28`,
    navBoxes.every((item) => item.iconX === 28 && item.iconW === 20),
    navBoxes.map(({ label, iconX, iconW }) => ({ label, iconX, iconW })),
  );
  check(
    `${prefix} nav items are 44px tall`,
    navBoxes.every((item) => item.h === 44),
    navBoxes.map(({ label, h }) => ({ label, h })),
  );

  const campaignElement = page.locator('[data-testid="nav-item"][data-nav-label="Campaigns"]');
  equal(`${prefix} Campaigns has no href`, await campaignElement.getAttribute("href"), null);
  equal(
    `${prefix} Campaigns is disabled`,
    await campaignElement.getAttribute("aria-disabled"),
    "true",
  );
  equal(
    `${prefix} Campaigns is not focusable`,
    await campaignElement.getAttribute("tabindex"),
    "-1",
  );
  check(
    `${prefix} Campaigns is not an anchor`,
    (await campaignElement.evaluate((element) => element.tagName)) === "DIV",
    {},
  );
  check(
    `${prefix} Campaigns shows Soon`,
    (await campaignElement.textContent())?.includes("Soon"),
    {},
  );

  const chevronCount = await page
    .locator('[data-testid="app-sidebar"] nav svg.lucide-chevron-down')
    .count();
  equal(`${prefix} nav chevrons are exactly listed`, chevronCount, CHEVRON_ITEMS.length);
  const chevronItems = await page
    .locator('[data-testid="app-sidebar"] nav li')
    .evaluateAll((items) =>
      items
        .filter((item) => item.querySelector("svg.lucide-chevron-down"))
        .map((item) => item.querySelector("[data-nav-label]")?.getAttribute("data-nav-label")),
    );
  equal(`${prefix} nav chevron placement`, chevronItems, CHEVRON_ITEMS);
  const chevronBoxes = navBoxes.filter((item) => item.chevronX !== null);
  check(
    `${prefix} chevrons are right aligned near x=250`,
    chevronBoxes.every((item) => item.chevronX >= 240 && item.chevronX + item.chevronW <= 268),
    chevronBoxes.map(({ label, chevronX, chevronW }) => ({ label, chevronX, chevronW })),
  );

  const activeItem = page.locator('[data-testid="nav-item"][data-active="true"]');
  equal(`${prefix} one active nav item`, await activeItem.count(), 1);
  const activeBox = await boxOf(activeItem);
  const activeStyle = await styleOf(activeItem, [
    "backgroundColor",
    "color",
    "borderRadius",
    "fontWeight",
    "fontSize",
  ]);
  check(
    `${prefix} active pill geometry`,
    activeBox && activeBox.x === 12 && Math.abs(activeBox.w - 264) <= 1 && activeBox.h === 44,
    activeBox,
  );
  equal(`${prefix} active pill radius`, activeStyle.borderRadius, "8px");
  equal(`${prefix} active pill background`, activeStyle.backgroundColor, "rgb(5, 117, 115)");
  equal(`${prefix} active label colour`, activeStyle.color, "rgb(255, 255, 255)");
  equal(`${prefix} active label weight`, activeStyle.fontWeight, "600");
  equal(`${prefix} active label size`, activeStyle.fontSize, "18px");
  equal(
    `${prefix} active is Dashboard`,
    await activeItem.getAttribute("data-nav-label"),
    "Dashboard",
  );

  const inactiveStyle = await styleOf(
    page.locator('[data-testid="nav-item"][data-nav-label="Client"]'),
    ["color", "fontSize", "borderRadius"],
  );
  equal(`${prefix} inactive label colour`, inactiveStyle.color, "rgb(73, 80, 87)");
  equal(`${prefix} inactive label size`, inactiveStyle.fontSize, "18px");
  equal(`${prefix} nav item radius`, inactiveStyle.borderRadius, "8px");

  const footer = page.getByTestId("sidebar-footer");
  const footerBox = await boxOf(footer);
  const footerText = await footer.innerText();
  check(`${prefix} sidebar footer is visible`, await footer.isVisible(), {});
  check(
    `${prefix} sidebar footer is two lines`,
    footerText.includes("AIMSCAMS") && footerText.includes("All rights reserved."),
    { footerText },
  );
  check(
    `${prefix} sidebar footer is above viewport bottom`,
    footerBox && footerBox.y + footerBox.h <= viewportH + 1,
    footerBox,
  );

  const toggle = page.getByTestId("sidebar-toggle");
  const toggleBox = await boxOf(toggle);
  const toggleStyle = await styleOf(toggle, ["backgroundColor", "borderColor", "color"]);
  check(
    `${prefix} collapse control is 44px and straddles sidebar edge`,
    toggleBox &&
      Math.abs(toggleBox.w - 44) <= 1 &&
      Math.abs(toggleBox.h - 44) <= 1 &&
      toggleBox.x < 300 &&
      toggleBox.x + toggleBox.w > 300,
    toggleBox,
  );
  check(
    `${prefix} collapse control is above footer`,
    toggleBox && footerBox && toggleBox.y + toggleBox.h <= footerBox.y + 1,
    { toggleBox, footerBox },
  );
  equal(`${prefix} collapse control background`, toggleStyle.backgroundColor, "rgb(255, 255, 255)");
  equal(`${prefix} collapse control border`, toggleStyle.borderColor, "rgb(222, 226, 230)");
  equal(`${prefix} collapse control chevron`, toggleStyle.color, "rgb(5, 117, 115)");

  // ---- Tabs and content ----------------------------------------------
  const tabCard = await boxOf(page.getByTestId("dashboard-tab-card"));
  const tabCardStyle = await styleOf(page.getByTestId("dashboard-tab-card"), [
    "borderRadius",
    "backgroundColor",
  ]);
  check(`${prefix} tab card starts 22px after sidebar`, tabCard && tabCard.x === 322, tabCard);
  check(`${prefix} tab card height is 104`, tabCard && Math.abs(tabCard.h - 104) <= 1, tabCard);
  equal(`${prefix} tab card radius`, tabCardStyle.borderRadius, "12px");
  equal(`${prefix} tab card background`, tabCardStyle.backgroundColor, "rgb(255, 255, 255)");

  const tabTriggers = page.getByRole("tab");
  equal(`${prefix} tab count`, await tabTriggers.count(), 3);
  const tabData = await tabTriggers.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        id: element.getAttribute("data-testid"),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        active: element.getAttribute("data-state") === "active",
        radius: style.borderRadius,
        bg: style.backgroundColor,
        color: style.color,
      };
    }),
  );
  check(
    `${prefix} active tab is 154x44`,
    tabData[0]?.active && tabData[0]?.w === 154 && tabData[0]?.h === 44,
    tabData,
  );
  equal(`${prefix} active tab radius`, tabData[0]?.radius, "8px");
  equal(`${prefix} active tab background`, tabData[0]?.bg, "rgb(5, 117, 115)");
  equal(`${prefix} active tab text`, tabData[0]?.color, "rgb(255, 255, 255)");
  check(
    `${prefix} inactive tabs have no background`,
    tabData.slice(1).every((tab) => tab.bg === "rgba(0, 0, 0, 0)" && tab.color === "rgb(0, 0, 0)"),
    tabData,
  );
  check(
    `${prefix} tab labels`,
    JSON.stringify(await tabTriggers.allTextContents()) ===
      JSON.stringify(["Overview", "Members", "Loans"]),
    await tabTriggers.allTextContents(),
  );

  const tabBranch = page.getByTestId("tab-branch-context");
  check(`${prefix} tab branch context visible`, await tabBranch.isVisible(), {});
  const tabBranchBox = await boxOf(tabBranch);
  check(
    `${prefix} tab branch context clears the tabs`,
    tabBranchBox && tabData[2] && tabBranchBox.x > tabData[2].x + tabData[2].w,
    { tabBranchBox, lastTab: tabData[2] },
  );

  const kpis = page.getByTestId("kpi-card");
  equal(`${prefix} KPI count`, await kpis.count(), 8);
  equal(`${prefix} KPI badge count`, await page.getByTestId("kpi-badge").count(), 8);
  const kpiData = await kpis.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const value = element.querySelector("p");
      const valueStyle = value ? getComputedStyle(value) : null;
      return {
        id: element.getAttribute("data-kpi-id"),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        radius: style.borderRadius,
        valueSize: valueStyle?.fontSize,
        valueWeight: valueStyle?.fontWeight,
        valueColor: valueStyle?.color,
      };
    }),
  );
  const firstRowCount = kpiData.filter((kpi) => kpi.y === kpiData[0]?.y).length;
  equal(`${prefix} KPI columns`, firstRowCount, viewportW >= 1536 ? 4 : 2);
  check(
    `${prefix} KPI cards are 185px tall and 12px radius`,
    kpiData.every((kpi) => Math.abs(kpi.h - 185) <= 2 && kpi.radius === "12px"),
    kpiData.map(({ id, h, radius }) => ({ id, h, radius })),
  );
  near(`${prefix} KPI horizontal gap`, kpiData[1].x - (kpiData[0].x + kpiData[0].w), 22, 1);
  near(
    `${prefix} KPI vertical gap`,
    kpiData[firstRowCount].y - (kpiData[0].y + kpiData[0].h),
    22,
    1,
  );
  check(
    `${prefix} KPI value typography`,
    kpiData.every(
      (kpi) =>
        kpi.valueSize === "30px" && kpi.valueWeight === "700" && kpi.valueColor === "rgb(0, 0, 0)",
    ),
    kpiData.map(({ id, valueSize, valueWeight, valueColor }) => ({
      id,
      valueSize,
      valueWeight,
      valueColor,
    })),
  );
  const kpiBadgeBoxes = await page.getByTestId("kpi-badge").evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { w: Math.round(rect.width), h: Math.round(rect.height) };
    }),
  );
  check(
    `${prefix} KPI badges are 66px`,
    kpiBadgeBoxes.every((badge) => badge.w === 66 && badge.h === 66),
    kpiBadgeBoxes,
  );

  const chart = page.getByTestId("funds-chart");
  const chartBox = await boxOf(chart);
  const chartStyle = await styleOf(chart, ["borderRadius", "padding"]);
  const portfolio = page.getByTestId("portfolio-composition");
  const portfolioBox = await boxOf(portfolio);
  check(`${prefix} chart is visible`, await chart.isVisible(), {});
  equal(`${prefix} chart radius`, chartStyle.borderRadius, "12px");
  equal(`${prefix} chart padding`, chartStyle.padding, "30px");
  check(
    `${prefix} chart title`,
    (await chart.getByRole("heading").textContent()) === "FundsInVsFundsOut",
    await chart.getByRole("heading").textContent(),
  );
  const chartTitleStyle = await styleOf(chart.getByRole("heading"), ["fontSize", "fontWeight"]);
  equal(`${prefix} chart title size`, chartTitleStyle.fontSize, "20px");
  equal(`${prefix} chart title weight`, chartTitleStyle.fontWeight, "700");

  const bars = page.getByTestId("funds-bar");
  equal(`${prefix} chart bar count`, await bars.count(), 2);
  const barData = await bars.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        series: element.getAttribute("data-series"),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        radius: style.borderRadius,
        bg: style.backgroundColor,
      };
    }),
  );
  check(
    `${prefix} chart bars are 77px and square`,
    barData.every((bar) => bar.w === 77 && bar.radius === "0px"),
    barData,
  );
  equal(`${prefix} funds in colour`, barData[0]?.bg, "rgb(5, 117, 115)");
  equal(`${prefix} funds out colour`, barData[1]?.bg, "rgb(199, 90, 67)");

  const ticks = await page.getByTestId("funds-axis-tick").allTextContents();
  equal(`${prefix} chart axis steps`, ticks, [
    "TZS 50M",
    "TZS 45M",
    "TZS 40M",
    "TZS 35M",
    "TZS 30M",
    "TZS 25M",
    "TZS 20M",
    "TZS 15M",
  ]);
  equal(`${prefix} gridline count`, await page.getByTestId("funds-gridline").count(), 8);
  const tickStyle = await styleOf(page.getByTestId("funds-axis-tick").first(), [
    "fontSize",
    "color",
  ]);
  equal(`${prefix} axis label size`, tickStyle.fontSize, "16px");
  equal(`${prefix} axis label colour`, tickStyle.color, "rgb(102, 102, 102)");
  const gridStyle = await styleOf(page.getByTestId("funds-gridline").first(), [
    "borderTopWidth",
    "borderLeftWidth",
  ]);
  equal(`${prefix} gridline is horizontal only`, gridStyle, {
    borderTopWidth: "1px",
    borderLeftWidth: "0px",
  });
  check(
    `${prefix} chart value labels`,
    JSON.stringify(await page.getByTestId("funds-value-label").allTextContents()) ===
      JSON.stringify(["47.5M", "38.3M"]),
    await page.getByTestId("funds-value-label").allTextContents(),
  );

  check(`${prefix} portfolio is visible`, await portfolio.isVisible(), {});
  equal(
    `${prefix} portfolio segment count`,
    await page.getByTestId("portfolio-segment").count(),
    4,
  );
  const portfolioWidths = await page
    .getByTestId("portfolio-segment")
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
  const portfolioBarBox = await boxOf(page.getByTestId("portfolio-bar"));
  const totalShare = portfolioWidths.reduce((sum, width) => sum + width, 0);
  check(
    `${prefix} portfolio segments fill the bar`,
    portfolioBarBox && Math.abs(totalShare - portfolioBarBox.w) <= 2,
    { totalShare: round(totalShare), portfolioBarBox },
  );
  check(
    `${prefix} desktop chart layout`,
    viewportW >= 1536
      ? chartBox && portfolioBox && chartBox.y === portfolioBox.y && chartBox.x < portfolioBox.x
      : chartBox && portfolioBox && portfolioBox.y > chartBox.y && chartBox.x === portfolioBox.x,
    { chartBox, portfolioBox },
  );

  const banner = page.getByTestId("unposted-banner");
  check(`${prefix} unposted banner visible`, await banner.isVisible(), {});
  check(`${prefix} unposted count`, (await banner.innerText()).includes("3 transactions"), {});

  const chat = await boxOf(page.getByTestId("chat-fab"));
  const chatStyle = await styleOf(page.getByTestId("chat-fab"), [
    "backgroundColor",
    "boxShadow",
    "borderRadius",
  ]);
  check(
    `${prefix} chat FAB is 90px at bottom-right`,
    chat &&
      Math.abs(chat.w - 90) <= 1 &&
      Math.abs(chat.h - 90) <= 1 &&
      Math.abs(chat.x + chat.w - (viewportW - 32)) <= 1 &&
      Math.abs(chat.y + chat.h - (viewportH - 32)) <= 1,
    { chat, viewportW, viewportH },
  );
  equal(`${prefix} chat FAB colour`, chatStyle.backgroundColor, "rgb(3, 118, 116)");
  check(`${prefix} chat FAB shadow`, chatStyle.boxShadow !== "none", {
    shadow: chatStyle.boxShadow,
  });

  const overflow = await pageOverflow(page);
  check(
    `${prefix} no horizontal scroll`,
    overflow.scroll <= overflow.client + 1 &&
      overflow.bodyScroll <= overflow.client + 1 &&
      overflow.offenders.length === 0,
    overflow,
  );

  await page.screenshot({ path: `artifacts/audit-${key}-expanded.png` });
  await page.screenshot({ path: `artifacts/audit-${key}-expanded-full.png`, fullPage: true });

  // ---- Language dropdown ---------------------------------------------
  await languageTrigger.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(180);
  let menu = page.getByRole("menu").last();
  check(`${prefix} language menu opens`, await menu.isVisible(), {});
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(100);
  const keyboardFocus = await activeElement(page);
  check(
    `${prefix} language menu is keyboard navigable`,
    keyboardFocus.role === "menuitemradio",
    keyboardFocus,
  );
  const menuBox = await boxOf(menu);
  check(
    `${prefix} language menu stays in viewport`,
    menuBox &&
      menuBox.x >= 0 &&
      menuBox.y >= 0 &&
      menuBox.x + menuBox.w <= viewportW &&
      menuBox.y + menuBox.h <= viewportH,
    menuBox,
  );
  await page.screenshot({ path: `artifacts/audit-${key}-language-menu.png` });
  await page.keyboard.press("Escape");
  check(`${prefix} language menu closes on Escape`, await waitForGone(menu), {});
  await page.waitForTimeout(120);
  equal(
    `${prefix} language focus returns to trigger`,
    (await activeElement(page)).testId,
    "language-trigger",
  );

  await languageTrigger.click();
  await page.getByRole("menuitemradio", { name: "Kiswahili" }).click();
  await page.waitForTimeout(150);
  equal(
    `${prefix} language selection updates`,
    await languageTrigger.getAttribute("aria-label"),
    "Language: Kiswahili",
  );
  check(`${prefix} language menu closes on selection`, await waitForGone(menu), {});
  await languageTrigger.click();
  await page.getByRole("menuitemradio", { name: "English" }).click();
  await page.waitForTimeout(150);
  equal(
    `${prefix} language resets`,
    await languageTrigger.getAttribute("aria-label"),
    "Language: English",
  );

  // ---- User dropdown -------------------------------------------------
  await userTrigger.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(180);
  menu = page.getByRole("menu").last();
  check(`${prefix} user menu opens`, await menu.isVisible(), {});
  const userMenuBox = await boxOf(menu);
  check(
    `${prefix} user menu stays in viewport`,
    userMenuBox &&
      userMenuBox.x >= 0 &&
      userMenuBox.y >= 0 &&
      userMenuBox.x + userMenuBox.w <= viewportW &&
      userMenuBox.y + userMenuBox.h <= viewportH,
    userMenuBox,
  );
  await page.screenshot({ path: `artifacts/audit-${key}-user-menu.png` });
  await page.keyboard.press("Escape");
  check(`${prefix} user menu closes on Escape`, await waitForGone(menu), {});
  await page.waitForTimeout(120);
  equal(
    `${prefix} user focus returns to trigger`,
    (await activeElement(page)).testId,
    "user-menu-trigger",
  );

  await userTrigger.click();
  await page.waitForTimeout(150);
  check(`${prefix} user menu reopens`, await menu.isVisible(), {});
  await page.mouse.click(viewportW / 2, 50);
  check(`${prefix} user menu closes on outside click`, await waitForGone(menu), {});

  // ---- Sheet ---------------------------------------------------------
  await page.getByTestId("unposted-review").click();
  await page.waitForTimeout(300);
  const sheet = page.getByTestId("unposted-sheet");
  check(`${prefix} unposted sheet opens`, await sheet.isVisible(), {});
  equal(`${prefix} unposted sheet is 448px`, (await boxOf(sheet))?.w, 448);
  equal(`${prefix} unposted sheet rows`, await sheet.locator("tbody tr").count(), 3);
  check(
    `${prefix} unposted sheet has no horizontal overflow`,
    await sheet.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    await sheet.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    })),
  );
  await page.screenshot({ path: `artifacts/audit-${key}-unposted-sheet.png` });
  await page.keyboard.press("Escape");
  check(`${prefix} unposted sheet closes on Escape`, await waitForGone(sheet), {});
  await page.waitForTimeout(200);
  equal(
    `${prefix} sheet focus returns to review`,
    (await activeElement(page)).testId,
    "unposted-review",
  );

  // ---- Chat dialog ---------------------------------------------------
  await page.getByTestId("chat-fab").click();
  await page.waitForTimeout(300);
  const chatDialog = page.getByRole("dialog");
  check(`${prefix} chat dialog opens`, await chatDialog.isVisible(), {});
  equal(
    `${prefix} chat dialog title`,
    await chatDialog.getByRole("heading").textContent(),
    "Support chat",
  );
  await page.screenshot({ path: `artifacts/audit-${key}-chat-dialog.png` });
  await page.keyboard.press("Escape");
  check(`${prefix} chat dialog closes on Escape`, await waitForGone(chatDialog), {});
  await page.waitForTimeout(200);
  equal(`${prefix} chat focus returns to FAB`, (await activeElement(page)).testId, "chat-fab");

  // ---- Chart tooltip -------------------------------------------------
  const firstBar = bars.first();
  await firstBar.hover();
  await page.waitForTimeout(150);
  let tooltip = page.getByRole("tooltip");
  check(`${prefix} chart tooltip opens on hover`, await tooltip.isVisible(), {});
  equal(`${prefix} chart tooltip text`, await tooltip.textContent(), "Funds in: TZS 47,500,000");
  await page.mouse.move(10, 140);
  await page.waitForTimeout(150);
  await firstBar.focus();
  await page.waitForTimeout(150);
  tooltip = page.getByRole("tooltip");
  check(`${prefix} chart tooltip opens on focus`, await tooltip.isVisible(), {});
  equal(
    `${prefix} chart focus tooltip text`,
    await tooltip.textContent(),
    "Funds in: TZS 47,500,000",
  );
  await page.getByTestId("dashboard-tab-overview").focus();
  await page.waitForTimeout(150);
  check(
    `${prefix} chart tooltip closes on blur`,
    !(await tooltip.isVisible().catch(() => false)),
    {},
  );

  // ---- Tabs ----------------------------------------------------------
  await page.getByTestId("dashboard-tab-members").click();
  await page.waitForTimeout(150);
  equal(
    `${prefix} Members tab activates`,
    await page.getByTestId("dashboard-tab-members").getAttribute("data-state"),
    "active",
  );
  check(
    `${prefix} Members empty state`,
    await page.getByRole("heading", { name: "Member analytics are not live yet" }).isVisible(),
    {},
  );
  check(
    `${prefix} Members hides KPIs`,
    !(await kpis
      .first()
      .isVisible()
      .catch(() => false)),
    {},
  );
  await page.screenshot({ path: `artifacts/audit-${key}-members-tab.png` });

  await page.getByTestId("dashboard-tab-overview").focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(150);
  equal(
    `${prefix} tab keyboard activation`,
    await page.getByTestId("dashboard-tab-members").getAttribute("data-state"),
    "active",
  );
  equal(
    `${prefix} tab keyboard focus`,
    (await activeElement(page)).testId,
    "dashboard-tab-members",
  );

  await page.getByTestId("dashboard-tab-loans").click();
  await page.waitForTimeout(150);
  check(
    `${prefix} Loans empty state`,
    await page.getByRole("heading", { name: "Loan analytics are not live yet" }).isVisible(),
    {},
  );
  await page.getByTestId("dashboard-tab-overview").click();
  await page.waitForTimeout(150);

  // ---- Collapsed sidebar --------------------------------------------
  await page.getByTestId("sidebar-toggle").click();
  await page.waitForTimeout(350);
  const collapsedSidebar = await boxOf(page.getByTestId("app-sidebar"));
  check(
    `${prefix} collapsed sidebar is 76px below header`,
    collapsedSidebar && collapsedSidebar.w === 76 && Math.abs(collapsedSidebar.y - 97) <= 1,
    collapsedSidebar,
  );
  const collapsedItems = await navItems.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      const icon = element.querySelector("svg")?.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        label: element.getAttribute("data-nav-label"),
        x: Math.round(rect.x),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        iconX: icon ? Math.round(icon.x) : null,
        iconW: icon ? Math.round(icon.width) : null,
        text: element.textContent?.trim(),
        color: style.color,
        background: style.backgroundColor,
        radius: style.borderRadius,
      };
    }),
  );
  check(
    `${prefix} collapsed icons stay on x=38 axis`,
    collapsedItems.every((item) => item.iconX === 28 && item.iconW === 20),
    collapsedItems.map(({ label, iconX, iconW }) => ({ label, iconX, iconW })),
  );
  check(
    `${prefix} collapsed labels are removed`,
    collapsedItems.every((item) => item.text === ""),
    collapsedItems.map(({ label, text }) => ({ label, text })),
  );
  check(
    `${prefix} collapsed items expose accessible names`,
    collapsedItems.every((item) => Boolean(item.label)),
    collapsedItems.map(({ label }) => label),
  );
  const collapsedActive = collapsedItems.find((item) => item.label === "Dashboard");
  equal(
    `${prefix} collapsed active stays visible`,
    collapsedActive?.background,
    "rgb(5, 117, 115)",
  );
  equal(`${prefix} collapsed active radius`, collapsedActive?.radius, "8px");
  equal(`${prefix} collapsed active text`, collapsedActive?.color, "rgb(255, 255, 255)");
  const collapsedToggle = await boxOf(page.getByTestId("sidebar-toggle"));
  check(
    `${prefix} collapsed toggle straddles 76px edge`,
    collapsedToggle &&
      Math.abs(collapsedToggle.w - 44) <= 1 &&
      collapsedToggle.x < 76 &&
      collapsedToggle.x + collapsedToggle.w > 76,
    collapsedToggle,
  );
  const collapsedFooter = await boxOf(page.getByTestId("sidebar-footer"));
  check(
    `${prefix} collapsed toggle clears footer`,
    collapsedToggle &&
      collapsedFooter &&
      collapsedToggle.y + collapsedToggle.h <= collapsedFooter.y + 1,
    { collapsedToggle, collapsedFooter },
  );
  const collapsedOverflow = await pageOverflow(page);
  check(
    `${prefix} collapsed sidebar has no horizontal scroll`,
    collapsedOverflow.scroll <= collapsedOverflow.client + 1 &&
      collapsedOverflow.offenders.length === 0,
    collapsedOverflow,
  );

  await navItems.first().hover();
  await page.waitForTimeout(900);
  const collapsedTooltip = page.getByRole("tooltip");
  check(`${prefix} collapsed nav tooltip opens`, await collapsedTooltip.isVisible(), {});
  equal(`${prefix} collapsed nav tooltip text`, await collapsedTooltip.textContent(), "Dashboard");
  await page.mouse.move(viewportW - 40, viewportH - 200);
  await page.waitForTimeout(200);

  await page.screenshot({ path: `artifacts/audit-${key}-collapsed.png` });
  await page.screenshot({ path: `artifacts/audit-${key}-collapsed-full.png`, fullPage: true });

  await page.getByTestId("sidebar-toggle").click();
  await page.waitForTimeout(350);
  const expandedAgain = await boxOf(page.getByTestId("app-sidebar"));
  equal(`${prefix} sidebar expands again`, expandedAgain?.w, 300);

  // ---- Console and network ------------------------------------------
  equal(`${prefix} console is free of errors`, [...new Set(consoleErrors)], []);
  equal(`${prefix} no failed responses`, badResponses, []);

  report.viewports[key] = {
    header,
    sidebar,
    activeBox,
    tabCard,
    kpis: kpiData,
    chartBox,
    portfolioBox,
    chat,
    toggleBox,
    collapsedSidebar,
    overflow,
    collapsedOverflow,
    consoleErrors: [...new Set(consoleErrors)],
    badResponses,
    artifacts: [
      `audit-${key}-expanded.png`,
      `audit-${key}-expanded-full.png`,
      `audit-${key}-language-menu.png`,
      `audit-${key}-user-menu.png`,
      `audit-${key}-unposted-sheet.png`,
      `audit-${key}-chat-dialog.png`,
      `audit-${key}-members-tab.png`,
      `audit-${key}-collapsed.png`,
      `audit-${key}-collapsed-full.png`,
    ],
  };

  await context.close();
}

await browser.close();
await writeFile("artifacts/audit-report.json", JSON.stringify(report, null, 2));

const passed = checks.filter((entry) => entry.pass).length;
console.log(`AIMSCAMS UI audit: ${passed}/${checks.length} checks passed`);
for (const viewport of viewports) {
  const key = `${viewport.width}x${viewport.height}`;
  const data = report.viewports[key];
  console.log(
    JSON.stringify({
      viewport: key,
      header: data.header,
      sidebar: data.sidebar,
      active: data.activeBox,
      tabCard: data.tabCard,
      kpiColumns: data.kpis.filter((kpi) => kpi.y === data.kpis[0]?.y).length,
      chart: data.chartBox,
      portfolio: data.portfolioBox,
      chat: data.chat,
      collapsedSidebar: data.collapsedSidebar,
      horizontalScroll: [data.overflow.scroll, data.overflow.client],
      consoleErrors: data.consoleErrors,
      badResponses: data.badResponses,
    }),
  );
}

if (failures.length > 0) {
  console.error(`\n${failures.length} failure(s):`);
  for (const failure of failures) {
    console.error(`- ${failure.name}: ${JSON.stringify(failure.detail)}`);
  }
  process.exitCode = 1;
}
